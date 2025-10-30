/**
 * Database migration utility for PanicSense
 * Direct TypeScript implementation for migrating data between databases
 */

import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();

// Define old database connection
const OLD_DATABASE_URL = "postgresql://neondb_owner:npg_HLm0beDSuxPd@ep-still-snow-09343008-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const NEW_DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_mKCjny10GxcW@ep-fancy-moon-a1b99crw-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// Database pools
const oldPool = new Pool({
  connectionString: OLD_DATABASE_URL,
  ssl: true,
  max: 5, // Limit connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

const newPool = new Pool({
  connectionString: NEW_DATABASE_URL,
  ssl: true,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Migration status tracking
let migrationStatus = {
  inProgress: false,
  lastRun: null as Date | null,
  success: null as boolean | null,
  error: null as string | null,
  filesCount: 0,
  postsCount: 0
};

// Route to check database connection and status
router.get('/check', async (req, res) => {
  try {
    // Test old database connection
    const oldResult = await oldPool.query('SELECT NOW() as time');
    const oldTime = oldResult.rows[0].time;
    
    // Test new database connection
    const newResult = await newPool.query('SELECT NOW() as time');
    const newTime = newResult.rows[0].time;
    
    // Count records in both databases
    const oldFilesResult = await oldPool.query('SELECT COUNT(*) FROM analyzed_files');
    const oldPostsResult = await oldPool.query('SELECT COUNT(*) FROM sentiment_posts');
    
    const newFilesResult = await newPool.query('SELECT COUNT(*) FROM analyzed_files');
    const newPostsResult = await newPool.query('SELECT COUNT(*) FROM sentiment_posts');
    
    res.json({
      success: true,
      oldDatabase: {
        connected: true,
        time: oldTime,
        analyzedFiles: parseInt(oldFilesResult.rows[0].count),
        sentimentPosts: parseInt(oldPostsResult.rows[0].count)
      },
      newDatabase: {
        connected: true,
        time: newTime,
        analyzedFiles: parseInt(newFilesResult.rows[0].count),
        sentimentPosts: parseInt(newPostsResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Route to migrate analyzed files
router.post('/migrate-files', async (req, res) => {
  if (migrationStatus.inProgress) {
    return res.status(409).json({
      success: false,
      message: 'Migration already in progress',
      status: migrationStatus
    });
  }
  
  migrationStatus = {
    inProgress: true,
    lastRun: new Date(),
    success: null,
    error: null,
    filesCount: 0,
    postsCount: 0
  };
  
  // Start migration in background
  migrateFiles().catch(err => {
    console.error('Migration error:', err);
    migrationStatus.inProgress = false;
    migrationStatus.success = false;
    migrationStatus.error = err instanceof Error ? err.message : String(err);
  });
  
  res.json({
    success: true,
    message: 'Migration started',
    status: migrationStatus
  });
});

// Route to migrate sentiment posts
router.post('/migrate-posts', async (req, res) => {
  if (migrationStatus.inProgress) {
    return res.status(409).json({
      success: false,
      message: 'Migration already in progress',
      status: migrationStatus
    });
  }
  
  migrationStatus = {
    inProgress: true,
    lastRun: new Date(),
    success: null,
    error: null,
    filesCount: 0,
    postsCount: 0
  };
  
  // Start migration in background
  migratePosts().catch(err => {
    console.error('Migration error:', err);
    migrationStatus.inProgress = false;
    migrationStatus.success = false;
    migrationStatus.error = err instanceof Error ? err.message : String(err);
  });
  
  res.json({
    success: true,
    message: 'Migration started',
    status: migrationStatus
  });
});

// Route to get migration status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: migrationStatus
  });
});

// Helper function to migrate analyzed files
async function migrateFiles() {
  try {
    // Get all analyzed files from old database
    const oldFilesResult = await oldPool.query('SELECT * FROM analyzed_files');
    const oldFiles = oldFilesResult.rows;
    console.log(`Found ${oldFiles.length} analyzed files in old database`);
    
    // Check if files exist in new database
    const newFilesResult = await newPool.query('SELECT id FROM analyzed_files');
    const newFileIds = new Set(newFilesResult.rows.map(f => f.id));
    
    // Filter out files that already exist
    const filesToMigrate = oldFiles.filter(file => !newFileIds.has(file.id));
    console.log(`Migrating ${filesToMigrate.length} files...`);
    
    // Migrate each file
    for (const file of filesToMigrate) {
      try {
        await newPool.query(
          `INSERT INTO analyzed_files (
            id, filename, file_path, upload_date, total_records, 
            processed_records, status, metrics, created_at, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING`,
          [
            file.id, 
            file.filename, 
            file.file_path, 
            file.upload_date, 
            file.total_records, 
            file.processed_records,
            file.status, 
            file.metrics, 
            file.created_at || new Date(),
            file.metadata
          ]
        );
        
        migrationStatus.filesCount++;
        console.log(`Migrated file: ${file.id} (${migrationStatus.filesCount}/${filesToMigrate.length})`);
      } catch (error) {
        console.error(`Error migrating file ${file.id}:`, error);
      }
    }
    
    migrationStatus.inProgress = false;
    migrationStatus.success = true;
    console.log('File migration completed successfully');
  } catch (error) {
    console.error('File migration failed:', error);
    migrationStatus.inProgress = false;
    migrationStatus.success = false;
    migrationStatus.error = error instanceof Error ? error.message : String(error);
    throw error;
  }
}

// Helper function to migrate sentiment posts
async function migratePosts() {
  try {
    // Get count from old database to determine batching strategy
    const oldPostsCountResult = await oldPool.query('SELECT COUNT(*) FROM sentiment_posts');
    const totalPosts = parseInt(oldPostsCountResult.rows[0].count);
    console.log(`Found ${totalPosts} sentiment posts in old database`);
    
    // Check existing posts count
    const newPostsCountResult = await newPool.query('SELECT COUNT(*) FROM sentiment_posts');
    const existingPosts = parseInt(newPostsCountResult.rows[0].count);
    console.log(`Found ${existingPosts} existing posts in new database`);
    
    if (existingPosts > 0 && existingPosts >= totalPosts) {
      console.log('All posts already migrated, skipping');
      migrationStatus.inProgress = false;
      migrationStatus.success = true;
      return;
    }
    
    // Migrate in batches (100 posts per batch)
    const batchSize = 100;
    const totalBatches = Math.ceil(totalPosts / batchSize);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const offset = batch * batchSize;
      console.log(`Processing batch ${batch + 1}/${totalBatches} (offset: ${offset})`);
      
      // Fetch batch of posts
      const batchResult = await oldPool.query(
        'SELECT * FROM sentiment_posts ORDER BY id LIMIT $1 OFFSET $2',
        [batchSize, offset]
      );
      
      const posts = batchResult.rows;
      
      // For each post in batch
      for (const post of posts) {
        try {
          // Check if post already exists
          const existingResult = await newPool.query(
            'SELECT id FROM sentiment_posts WHERE id = $1',
            [post.id]
          );
          
          if (existingResult.rows.length === 0) {
            // Insert the post
            await newPool.query(
              `INSERT INTO sentiment_posts (
                id, text, timestamp, source, language, sentiment, confidence, 
                location, disaster_type, file_id, explanation, processed_by, ai_trust_message
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
              [
                post.id, post.text, post.timestamp, post.source, post.language,
                post.sentiment, post.confidence, post.location, post.disaster_type,
                post.file_id, post.explanation, post.processed_by, post.ai_trust_message
              ]
            );
            
            migrationStatus.postsCount++;
          }
        } catch (error) {
          console.error(`Error migrating post ${post.id}:`, error);
        }
      }
      
      console.log(`Completed batch ${batch + 1}/${totalBatches}`);
    }
    
    migrationStatus.inProgress = false;
    migrationStatus.success = true;
    console.log('Post migration completed successfully');
  } catch (error) {
    console.error('Post migration failed:', error);
    migrationStatus.inProgress = false;
    migrationStatus.success = false;
    migrationStatus.error = error instanceof Error ? error.message : String(error);
    throw error;
  }
}

export default router;