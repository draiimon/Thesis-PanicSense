import { users, type User, type InsertUser, 
  sentimentPosts, type SentimentPost, type InsertSentimentPost,
  disasterEvents, type DisasterEvent, type InsertDisasterEvent,
  analyzedFiles, type AnalyzedFile, type InsertAnalyzedFile,
  sessions, type LoginUser,
  profileImages, type ProfileImage, type InsertProfileImage,
  sentimentFeedback, type SentimentFeedback, type InsertSentimentFeedback,
  trainingExamples, type TrainingExample, type InsertTrainingExample,
  uploadSessions, type UploadSession, type InsertUploadSession
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// We'll use the standard pool connection but with better error handling

export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  loginUser(credentials: LoginUser): Promise<User | null>;
  createSession(userId: number): Promise<string>;
  validateSession(token: string): Promise<User | null>;

  // Sentiment Analysis
  getSentimentPosts(): Promise<SentimentPost[]>;
  getSentimentPostsByFileId(fileId: number): Promise<SentimentPost[]>;
  getSentimentPostById(id: number): Promise<SentimentPost | undefined>;
  getRecentSentimentPosts(limit?: number): Promise<SentimentPost[]>;
  createSentimentPost(post: InsertSentimentPost): Promise<SentimentPost>;
  createManySentimentPosts(posts: InsertSentimentPost[]): Promise<SentimentPost[]>;
  deleteSentimentPost(id: number): Promise<void>;
  deleteAllSentimentPosts(): Promise<void>;
  deleteSentimentPostsByFileId(fileId: number): Promise<void>;

  // Disaster Events
  getDisasterEvents(): Promise<DisasterEvent[]>;
  createDisasterEvent(event: InsertDisasterEvent): Promise<DisasterEvent>;
  deleteDisasterEvent(id: number): Promise<void>;
  deleteAllDisasterEvents(): Promise<void>;

  // File Analysis
  getAnalyzedFiles(): Promise<AnalyzedFile[]>;
  getAnalyzedFile(id: number): Promise<AnalyzedFile | undefined>;
  createAnalyzedFile(file: InsertAnalyzedFile): Promise<AnalyzedFile>;
  deleteAnalyzedFile(id: number): Promise<void>;
  deleteAllAnalyzedFiles(): Promise<void>;
  updateFileMetrics(fileId: number, metrics: any): Promise<void>;

  // Profile Images
  getProfileImages(): Promise<ProfileImage[]>;
  createProfileImage(profile: InsertProfileImage): Promise<ProfileImage>;
  
  // Sentiment Feedback Training
  getSentimentFeedback(): Promise<SentimentFeedback[]>;
  getUntrainedFeedback(): Promise<SentimentFeedback[]>;
  submitSentimentFeedback(feedback: InsertSentimentFeedback): Promise<SentimentFeedback>;
  markFeedbackAsTrained(id: number): Promise<void>;
  
  // Training Examples Management
  getTrainingExamples(): Promise<TrainingExample[]>;
  getTrainingExampleByText(text: string): Promise<TrainingExample | undefined>;
  createTrainingExample(example: InsertTrainingExample): Promise<TrainingExample>;
  updateTrainingExample(id: number, sentiment: string): Promise<TrainingExample>;
  deleteTrainingExample(id: number): Promise<void>;
  
  // Upload Sessions Management
  getUploadSession(sessionId: string): Promise<UploadSession | undefined>;
  getAllActiveSessions(): Promise<UploadSession[]>;
  createUploadSession(session: InsertUploadSession): Promise<UploadSession>;
  updateUploadSession(sessionId: string, status: string, progress: any): Promise<UploadSession | undefined>;
  deleteUploadSession(sessionId: string): Promise<void>;

  // Delete All Data
  deleteAllData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Helper method to map emotion to sentiment category
  private mapEmotionToSentimentCategory(emotion: string): string {
    const mapping: Record<string, string> = {
      'Panic': 'Negative',
      'Fear/Anxiety': 'Negative',
      'Disbelief': 'Negative',
      'Resilience': 'Positive',
      'Neutral': 'Neutral'
    };
    return mapping[emotion] || 'Neutral';
  }
  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Use standard database connection with error handling
      const [user] = await db.select()
        .from(users)
        .where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      // Try direct SQL query as fallback 
      try {
        const result = await pool.query(
          'SELECT * FROM users WHERE username = $1 LIMIT 1',
          [username]
        );
        return result.rows.length > 0 ? result.rows[0] : undefined;
      } catch (fallbackError) {
        console.error("Fallback in getUserByUsername failed:", fallbackError);
        return undefined;
      }
    }
  }

  async createUser(insertUser: Omit<InsertUser, "confirmPassword">): Promise<User> {
    try {
      // Use standard ORM method first
      const hashedPassword = await bcrypt.hash(insertUser.password, 10);
      const [user] = await db.insert(users).values({
        ...insertUser,
        password: hashedPassword,
        createdAt: new Date()
      }).returning();
      return user;
    } catch (error) {
      console.error("Error in createUser:", error);
      
      // Try direct SQL as fallback
      try {
        const hashedPassword = await bcrypt.hash(insertUser.password, 10);
        const result = await pool.query(
          'INSERT INTO users (username, password, email, full_name, role, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [
            insertUser.username, 
            hashedPassword, 
            insertUser.email, 
            insertUser.fullName, 
            insertUser.role || 'user', 
            new Date()
          ]
        );
        return result.rows[0];
      } catch (fallbackError) {
        console.error("Fallback in createUser failed:", fallbackError);
        throw fallbackError;
      }
    }
  }

  async loginUser(credentials: LoginUser): Promise<User | null> {
    try {
      // SPECIAL ADMIN CASE: Direct login for panicsenseadmin
      if (credentials.username === 'panicsenseadmin' && credentials.password === '123456789') {
        console.log("✅ Special admin login accepted!");
        
        // Create/fetch admin user directly
        let adminUser = await this.getUserByUsername('panicsenseadmin');
        
        // If admin doesn't exist yet, create it
        if (!adminUser) {
          try {
            // Try to create directly through SQL to avoid hashing
            const result = await pool.query(
              'INSERT INTO users (username, password, email, full_name, role, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
              [
                'panicsenseadmin',
                '123456789', // Plain password as requested
                'admin@panicsense.ph',
                'PanicSense Administrator',
                'admin',
                new Date()
              ]
            );
            adminUser = result.rows[0];
            console.log("Created special admin user directly");
          } catch (createError) {
            console.error("Error creating admin user:", createError);
            
            // If there's a duplicate error, try to get the user again
            adminUser = await this.getUserByUsername('panicsenseadmin');
            
            // If we still don't have an admin user, something's wrong
            if (!adminUser) {
              console.error("Failed to create or retrieve admin user");
              return null;
            }
          }
        }
        
        return adminUser;
      }
      
      // Regular login flow for normal users
      const user = await this.getUserByUsername(credentials.username);
      if (!user) return null;
      
      // SPECIAL CASE: If it's the admin user with direct password
      if (user.username === 'panicsenseadmin' && credentials.password === '123456789') {
        console.log("✅ Admin direct password login accepted!");
        return user;
      }
      
      // Normal password verification for regular users
      const valid = await bcrypt.compare(credentials.password, user.password);
      if (!valid) return null;
      
      return user;
    } catch (error) {
      console.error("Error in loginUser:", error);
      return null; 
    }
  }

  async createSession(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    await db.insert(sessions).values({
      userId,
      token,
      expiresAt
    });

    return token;
  }

  async validateSession(token: string): Promise<User | null> {
    const [session] = await db.select()
      .from(sessions)
      .where(eq(sessions.token, token));

    if (!session || new Date() > session.expiresAt) {
      return null;
    }

    const user = await this.getUser(session.userId);
    return user || null;
  }

  // Sentiment Analysis
  async getSentimentPosts(): Promise<SentimentPost[]> {
    try {
      // Use direct SQL query that only selects columns we know exist
      const result = await db.execute(sql`
        SELECT 
          id, 
          text, 
          timestamp, 
          source, 
          language, 
          sentiment, 
          sentiment_category as "sentimentCategory",
          confidence, 
          location, 
          disaster_type as "disasterType", 
          disaster_event_id as "disasterEventId",
          file_id as "fileId", 
          explanation, 
          processed_by as "processedBy", 
          ai_trust_message as "aiTrustMessage"
        FROM sentiment_posts
        LIMIT 1000000
      `);
      
      // Convert database results to the expected SentimentPost type
      return result.rows.map(row => {
        return {
          id: row.id,
          text: row.text,
          timestamp: new Date(row.timestamp),
          source: row.source,
          language: row.language,
          sentiment: row.sentiment,
          sentimentCategory: row.sentimentCategory,
          confidence: row.confidence,
          location: row.location,
          disasterType: row.disasterType,
          disasterEventId: row.disasterEventId,
          fileId: row.fileId,
          explanation: row.explanation,
          processedBy: row.processedBy,
          aiTrustMessage: row.aiTrustMessage
        };
      });
    } catch (error) {
      console.error("Error in getSentimentPosts:", error);
      
      // Fallback to a more explicit select of only known-safe columns
      const results = await db.select({
        id: sentimentPosts.id,
        text: sentimentPosts.text,
        timestamp: sentimentPosts.timestamp,
        source: sentimentPosts.source,
        language: sentimentPosts.language,
        sentiment: sentimentPosts.sentiment,
        confidence: sentimentPosts.confidence,
        location: sentimentPosts.location,
        disasterType: sentimentPosts.disasterType,
        fileId: sentimentPosts.fileId,
        explanation: sentimentPosts.explanation,
        processedBy: sentimentPosts.processedBy,
        sentimentCategory: sentimentPosts.sentimentCategory
        // Deliberately omitting aiTrustMessage
      }).from(sentimentPosts);
      
      // Add missing aiTrustMessage field to each result (with null value)
      return results.map(post => ({
        ...post,
        aiTrustMessage: null
      })) as SentimentPost[];
    }
  }

  async getSentimentPostsByFileId(fileId: number): Promise<SentimentPost[]> {
    try {
      // Use direct SQL with high limit to ensure all records are returned
      const result = await pool.query(`
        SELECT * FROM sentiment_posts
        WHERE file_id = $1
        LIMIT 1000000
      `, [fileId]);
      
      if (result.rows && result.rows.length > 0) {
        console.log(`Retrieved ${result.rows.length} sentiment posts directly for file ${fileId}`);
        return result.rows;
      }
      
      // Fallback to ORM if direct query returns no results
      return db.select()
        .from(sentimentPosts)
        .where(eq(sentimentPosts.fileId, fileId)) as Promise<SentimentPost[]>;
    } catch (error) {
      console.error("Error in getSentimentPostsByFileId:", error);
      
      // Fallback to a more explicit select of only known-safe columns
      const results = await db.select({
        id: sentimentPosts.id,
        text: sentimentPosts.text,
        timestamp: sentimentPosts.timestamp,
        source: sentimentPosts.source,
        language: sentimentPosts.language,
        sentiment: sentimentPosts.sentiment,
        confidence: sentimentPosts.confidence,
        location: sentimentPosts.location,
        disasterType: sentimentPosts.disasterType,
        fileId: sentimentPosts.fileId,
        explanation: sentimentPosts.explanation,
        processedBy: sentimentPosts.processedBy,
        sentimentCategory: sentimentPosts.sentimentCategory
        // Deliberately omitting aiTrustMessage
      })
      .from(sentimentPosts)
      .where(eq(sentimentPosts.fileId, fileId));
      
      // Add missing aiTrustMessage field to each result (with null value)
      return results.map(post => ({
        ...post,
        aiTrustMessage: null
      })) as SentimentPost[];
    }
  }
  
  async getSentimentPostById(id: number): Promise<SentimentPost | undefined> {
    try {
      const [post] = await db.select().from(sentimentPosts).where(eq(sentimentPosts.id, id));
      return post;
    } catch (error) {
      console.error("Error in getSentimentPostById:", error);
      
      // Fallback to raw SQL
      try {
        const result = await db.execute(sql`
          SELECT * FROM sentiment_posts WHERE id = ${id} LIMIT 1
        `);
        
        if (!result.rows || result.rows.length === 0) {
          return undefined;
        }
        
        // Convert database column names to JavaScript field names
        const post = {
          id: result.rows[0].id,
          text: result.rows[0].text,
          timestamp: new Date(result.rows[0].timestamp as string),
          source: result.rows[0].source,
          language: result.rows[0].language,
          sentiment: result.rows[0].sentiment,
          sentimentCategory: result.rows[0].sentiment_category,
          confidence: result.rows[0].confidence,
          location: result.rows[0].location,
          disasterType: result.rows[0].disaster_type,
          fileId: result.rows[0].file_id,
          explanation: result.rows[0].explanation,
          processedBy: result.rows[0].processed_by,
          aiTrustMessage: result.rows[0].ai_trust_message
        };
        return post as SentimentPost;
      } catch (fallbackError) {
        console.error("Fallback in getSentimentPostById also failed:", fallbackError);
        return undefined;
      }
    }
  }
  
  async getRecentSentimentPosts(limit: number = 20): Promise<SentimentPost[]> {
    try {
      // Try to get the latest posts with drizzle
      return db.select()
        .from(sentimentPosts)
        .orderBy(sql`${sentimentPosts.timestamp} DESC`)
        .limit(limit) as Promise<SentimentPost[]>;
    } catch (error) {
      console.error("Error in getRecentSentimentPosts:", error);
      
      // Fallback to raw SQL
      try {
        const result = await db.execute(sql`
          SELECT * FROM sentiment_posts 
          ORDER BY timestamp DESC 
          LIMIT ${limit}
        `);
        
        // Convert database column names to JavaScript field names
        return result.rows.map(row => ({
          id: row.id,
          text: row.text,
          timestamp: new Date(row.timestamp as string),
          source: row.source,
          language: row.language,
          sentiment: row.sentiment,
          sentimentCategory: row.sentiment_category,
          confidence: row.confidence,
          location: row.location,
          disasterType: row.disaster_type,
          fileId: row.file_id,
          explanation: row.explanation,
          processedBy: row.processed_by,
          aiTrustMessage: row.ai_trust_message
        })) as SentimentPost[];
      } catch (fallbackError) {
        console.error("Fallback in getRecentSentimentPosts also failed:", fallbackError);
        return [];
      }
    }
  }

  /**
   * Find or create a disaster event based on type and location
   * This ensures all related sentiment posts are linked to the same disaster event
   */
  private async findOrCreateDisasterEvent(disasterType: string | null, location: string | null): Promise<number | null> {
    // Only create disaster events if both type and location are provided
    if (!disasterType || !location) {
      return null;
    }
    
    try {
      // Sanitize inputs
      const safeType = disasterType.replace(/'/g, "''");
      const safeLocation = location.replace(/'/g, "''");
      
      // First, try to find an existing disaster event with the same type and location
      // Look for recent events (within last 7 days) to group related posts
      const existingEvent = await pool.query(
        `SELECT id FROM disaster_events 
         WHERE type = $1 AND location = $2 
         AND timestamp >= NOW() - INTERVAL '7 days'
         ORDER BY timestamp DESC
         LIMIT 1`,
        [disasterType, location]
      );
      
      if (existingEvent.rows.length > 0) {
        console.log(`[storage] LINKED to existing disaster event ID: ${existingEvent.rows[0].id}`);
        return existingEvent.rows[0].id;
      }
      
      // If no existing event found, create a new one
      const eventName = `${disasterType} in ${location}`;
      const eventDescription = `Based on reports from the community about ${disasterType.toLowerCase()} in ${location}`;
      
      const newEvent = await pool.query(
        `INSERT INTO disaster_events (name, description, type, location, timestamp)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id`,
        [eventName, eventDescription, disasterType, location]
      );
      
      console.log(`[storage] CREATED new disaster event ID: ${newEvent.rows[0].id} for ${disasterType} in ${location}`);
      return newEvent.rows[0].id;
    } catch (error) {
      console.error('[storage] Error in findOrCreateDisasterEvent:', error);
      return null; // Don't fail the whole post creation if event linking fails
    }
  }

  async createSentimentPost(sentimentPost: InsertSentimentPost): Promise<SentimentPost> {
    try {
      // CHECK FOR DUPLICATES - Don't save if exact same text already exists
      const duplicateCheck = await pool.query(
        'SELECT id FROM sentiment_posts WHERE text = $1 LIMIT 1',
        [sentimentPost.text]
      );
      
      if (duplicateCheck.rows.length > 0) {
        console.log(`[storage] DUPLICATE DETECTED - Skipping tweet: ${sentimentPost.text.substring(0, 50)}...`);
        // Return the existing post instead of creating a duplicate
        const [existingPost] = await db.select().from(sentimentPosts).where(eq(sentimentPosts.id, duplicateCheck.rows[0].id));
        return existingPost;
      }
      
      // AUTO-LINK TO DISASTER EVENT if location and disaster type are provided
      const disasterEventId = await this.findOrCreateDisasterEvent(
        sentimentPost.disasterType || null,
        sentimentPost.location || null
      );
      
      // Create timestamp as ISO string for proper formatting in the query
      const timestamp = sentimentPost.timestamp instanceof Date ? 
        sentimentPost.timestamp.toISOString() : 
        (typeof sentimentPost.timestamp === 'string' ? sentimentPost.timestamp : new Date().toISOString());
      
      // Sanitize all inputs for SQL safety
      const safeText = sentimentPost.text ? sentimentPost.text.replace(/'/g, "''") : "No text provided";
      const safeSource = sentimentPost.source ? sentimentPost.source.replace(/'/g, "''") : null;
      const safeLanguage = sentimentPost.language ? sentimentPost.language.replace(/'/g, "''") : null;
      const safeSentiment = sentimentPost.sentiment ? sentimentPost.sentiment.replace(/'/g, "''") : "Unknown";
      const safeConfidence = typeof sentimentPost.confidence === 'number' ? sentimentPost.confidence : 0.5;
      const safeLocation = sentimentPost.location ? sentimentPost.location.replace(/'/g, "''") : null;
      const safeDisasterType = sentimentPost.disasterType ? sentimentPost.disasterType.replace(/'/g, "''") : null;
      const safeExplanation = sentimentPost.explanation ? sentimentPost.explanation.replace(/'/g, "''") : null;
      const safeProcessedBy = sentimentPost.processedBy && typeof sentimentPost.processedBy === 'string' 
        ? sentimentPost.processedBy.replace(/'/g, "''") 
        : (sentimentPost.processedBy ? String(sentimentPost.processedBy) : null);
      
      // Get sentiment category from sentiment emotion if not provided
      const safeSentimentCategory = sentimentPost.sentimentCategory 
        ? sentimentPost.sentimentCategory.replace(/'/g, "''") 
        : this.mapEmotionToSentimentCategory(safeSentiment);
      
      // First try to check if the sentiment_category column exists
      let hasColumnResult;
      try {
        hasColumnResult = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'sentiment_posts' AND column_name = 'sentiment_category'
        `);
      } catch (err) {
        console.log('Error checking for column existence, assuming column does not exist:', err);
        hasColumnResult = { rows: [] };
      }
      
      // Check if the sentiment_category column exists
      const hasSentimentCategoryColumn = hasColumnResult.rows && hasColumnResult.rows.length > 0;
      
      // Also check for ai_trust_message column
      let aiTrustResult;
      try {
        aiTrustResult = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'sentiment_posts' AND column_name = 'ai_trust_message'
        `);
      } catch (err) {
        console.log('Error checking for ai_trust_message column, assuming it does not exist:', err);
        aiTrustResult = { rows: [] };
      }
      const hasAiTrustColumn = aiTrustResult.rows && aiTrustResult.rows.length > 0;
      
      // Execute the appropriate INSERT based on column existence
      let result;
      // Check for all possible column combinations and build the appropriate query
      const safeAiTrustMessage = sentimentPost.aiTrustMessage ? sentimentPost.aiTrustMessage.replace(/'/g, "''") : null;
      
      if (hasSentimentCategoryColumn && hasAiTrustColumn) {
        // Case 1: Both sentiment_category and ai_trust_message exist
        result = await db.execute(sql`
          INSERT INTO sentiment_posts (
            text, timestamp, source, language, sentiment,
            sentiment_category, confidence, location, disaster_type, 
            disaster_event_id, file_id, explanation, processed_by, ai_trust_message
          ) VALUES (
            ${safeText}, ${timestamp}, ${safeSource}, ${safeLanguage}, ${safeSentiment},
            ${safeSentimentCategory}, ${safeConfidence}, ${safeLocation}, ${safeDisasterType},
            ${disasterEventId}, ${sentimentPost.fileId || null}, ${safeExplanation}, ${safeProcessedBy}, ${safeAiTrustMessage}
          )
          RETURNING *
        `);
      } else if (hasSentimentCategoryColumn && !hasAiTrustColumn) {
        // Case 2: Only sentiment_category exists
        result = await db.execute(sql`
          INSERT INTO sentiment_posts (
            text, timestamp, source, language, sentiment,
            sentiment_category, confidence, location, disaster_type, 
            disaster_event_id, file_id, explanation, processed_by
          ) VALUES (
            ${safeText}, ${timestamp}, ${safeSource}, ${safeLanguage}, ${safeSentiment},
            ${safeSentimentCategory}, ${safeConfidence}, ${safeLocation}, ${safeDisasterType},
            ${disasterEventId}, ${sentimentPost.fileId || null}, ${safeExplanation}, ${safeProcessedBy}
          )
          RETURNING *
        `);
      } else if (!hasSentimentCategoryColumn && hasAiTrustColumn) {
        // Case 3: Only ai_trust_message exists
        result = await db.execute(sql`
          INSERT INTO sentiment_posts (
            text, timestamp, source, language, sentiment,
            confidence, location, disaster_type, 
            disaster_event_id, file_id, explanation, processed_by, ai_trust_message
          ) VALUES (
            ${safeText}, ${timestamp}, ${safeSource}, ${safeLanguage}, ${safeSentiment},
            ${safeConfidence}, ${safeLocation}, ${safeDisasterType},
            ${disasterEventId}, ${sentimentPost.fileId || null}, ${safeExplanation}, ${safeProcessedBy}, ${safeAiTrustMessage}
          )
          RETURNING *
        `);
      } else {
        // Case 4: Neither column exists - most basic insert
        result = await db.execute(sql`
          INSERT INTO sentiment_posts (
            text, timestamp, source, language, sentiment,
            confidence, location, disaster_type, 
            disaster_event_id, file_id, explanation, processed_by
          ) VALUES (
            ${safeText}, ${timestamp}, ${safeSource}, ${safeLanguage}, ${safeSentiment},
            ${safeConfidence}, ${safeLocation}, ${safeDisasterType},
            ${disasterEventId}, ${sentimentPost.fileId || null}, ${safeExplanation}, ${safeProcessedBy}
          )
          RETURNING *
        `);
      }
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Insert successful but no rows returned');
      }
      
      console.log(`Sentiment post saved with ID: ${result.rows[0].id}`);
      // Convert database column names to JavaScript field names
      const post = {
        id: result.rows[0].id,
        text: result.rows[0].text,
        timestamp: new Date(result.rows[0].timestamp as string),
        source: result.rows[0].source,
        language: result.rows[0].language,
        sentiment: result.rows[0].sentiment,
        sentimentCategory: result.rows[0].sentiment_category,
        confidence: result.rows[0].confidence,
        location: result.rows[0].location,
        disasterType: result.rows[0].disaster_type,
        disasterEventId: result.rows[0].disaster_event_id,
        fileId: result.rows[0].file_id,
        explanation: result.rows[0].explanation,
        processedBy: result.rows[0].processed_by,
        aiTrustMessage: result.rows[0].ai_trust_message
      };
      return post as SentimentPost;
    } catch (error) {
      console.error("Error in createSentimentPost:", error);
      
      // Fallback to basic insert with only essential fields using raw SQL
      try {
        // Always include location, disaster_type, and file_id in the fallback
        // This is critical for CSV uploads to work properly
        // Add another fallback for extreme reliability
        // Handle text input to ensure SQL safety
        const safeText = sentimentPost.text ? sentimentPost.text.replace(/'/g, "''") : "No text provided";
        const safeTimestamp = sentimentPost.timestamp instanceof Date ? 
          sentimentPost.timestamp.toISOString() : 
          (typeof sentimentPost.timestamp === 'string' ? sentimentPost.timestamp : new Date().toISOString());
        const safeSource = sentimentPost.source ? sentimentPost.source.replace(/'/g, "''") : "Unknown";
        const safeLanguage = sentimentPost.language ? sentimentPost.language.replace(/'/g, "''") : "Unknown";
        const safeSentiment = sentimentPost.sentiment ? sentimentPost.sentiment.replace(/'/g, "''") : "Unknown";
        const safeConfidence = typeof sentimentPost.confidence === 'number' ? sentimentPost.confidence : 0.5;
        const safeLocation = sentimentPost.location ? sentimentPost.location.replace(/'/g, "''") : null;
        const safeDisasterType = sentimentPost.disasterType ? sentimentPost.disasterType.replace(/'/g, "''") : null;
        const safeExplanation = sentimentPost.explanation ? sentimentPost.explanation.replace(/'/g, "''") : "Direct DB insertion";
        
        // Auto-link to disaster event in fallback too
        const fallbackDisasterEventId = await this.findOrCreateDisasterEvent(
          sentimentPost.disasterType || null,
          sentimentPost.location || null
        );
        
        // Use raw SQL with parametrized queries for maximum stability
        const result = await db.execute(sql`
          INSERT INTO sentiment_posts (
            text, 
            timestamp, 
            source, 
            language, 
            sentiment, 
            confidence,
            location,
            disaster_type,
            disaster_event_id,
            file_id,
            explanation
          ) VALUES (
            ${safeText},
            ${safeTimestamp},
            ${safeSource},
            ${safeLanguage},
            ${safeSentiment},
            ${safeConfidence},
            ${safeLocation},
            ${safeDisasterType},
            ${fallbackDisasterEventId},
            ${sentimentPost.fileId || null},
            ${safeExplanation}
          )
          RETURNING *
        `);
        
        console.log(`Fallback sentiment post saved with ID: ${result.rows[0].id}`);
        // Convert database column names to JavaScript field names for the fallback case
        // Make sure to include location and disaster_type from the database result
        const fallbackPost = {
          id: result.rows[0].id,
          text: result.rows[0].text,
          timestamp: new Date(result.rows[0].timestamp as string),
          source: result.rows[0].source,
          language: result.rows[0].language,
          sentiment: result.rows[0].sentiment,
          confidence: result.rows[0].confidence,
          location: result.rows[0].location || null,
          disasterType: result.rows[0].disaster_type || null,
          disasterEventId: result.rows[0].disaster_event_id || null,
          fileId: result.rows[0].file_id || null,
          explanation: result.rows[0].explanation || null,
          processedBy: null,
          aiTrustMessage: null
        };
        return fallbackPost as SentimentPost;
      } catch (fallbackError) {
        console.error("Fallback insertion also failed:", fallbackError);
        throw fallbackError; // Re-throw after logging
      }
    }
  }

  async createManySentimentPosts(posts: InsertSentimentPost[]): Promise<SentimentPost[]> {
    const results: SentimentPost[] = [];
    
    try {
      // Using individual inserts with raw SQL for better error handling
      for (const post of posts) {
        try {
          const result = await this.createSentimentPost(post);
          results.push(result);
        } catch (postError) {
          console.error(`Error inserting single post in batch: ${postError}`);
          // Continue with other posts on error
        }
      }
      
      console.log(`Successfully inserted ${results.length} out of ${posts.length} posts`);
      return results;
    } catch (error) {
      console.error("Error in createManySentimentPosts:", error);
      
      // If we have at least some results, return them
      if (results.length > 0) {
        console.log(`Returning partial results: ${results.length} posts`);
        return results;
      }
      
      // If all fails, throw error
      throw error;
    }
  }

  async deleteSentimentPost(id: number): Promise<void> {
    await db.delete(sentimentPosts)
      .where(eq(sentimentPosts.id, id));
  }

  async deleteSentimentPostsByFileId(fileId: number): Promise<void> {
    await db.delete(sentimentPosts)
      .where(eq(sentimentPosts.fileId, fileId));
  }

  // Disaster Events
  async getDisasterEvents(): Promise<DisasterEvent[]> {
    return db.select().from(disasterEvents);
  }

  async createDisasterEvent(event: InsertDisasterEvent): Promise<DisasterEvent> {
    const [result] = await db.insert(disasterEvents)
      .values(event)
      .returning();
    return result;
  }
  
  async deleteDisasterEvent(id: number): Promise<void> {
    await db.delete(disasterEvents)
      .where(eq(disasterEvents.id, id));
  }

  // File Analysis
  async getAnalyzedFiles(): Promise<AnalyzedFile[]> {
    // Skip ORM directly and use simple SQL query that will definitely work
    try {
      console.log("Using direct SQL for analyzed files query");
      const result = await pool.query(`
        SELECT 
          id, 
          original_name as "originalName", 
          stored_name as "storedName", 
          record_count as "recordCount",
          COALESCE(evaluation_metrics, '{}') as "evaluationMetricsRaw"
        FROM analyzed_files
        ORDER BY id DESC
      `);
      
      return result.rows.map(row => {
        // Parse metrics if they exist
        let evaluationMetrics = null;
        try {
          if (row.evaluationMetricsRaw && row.evaluationMetricsRaw !== '{}') {
            evaluationMetrics = JSON.parse(row.evaluationMetricsRaw);
          }
        } catch (e) {
          console.error("Failed to parse evaluation metrics:", e);
        }
        
        // Return the mapped row
        return {
          id: row.id,
          originalName: row.originalName,
          storedName: row.storedName,
          recordCount: row.recordCount,
          evaluationMetrics
        };
      });
    } catch (error) {
      console.error("Direct SQL query for analyzed files failed:", error);
      
      // Last resort fallback with minimal fields
      try {
        console.log("Attempting minimal fallback query");
        const result = await pool.query(`
          SELECT 
            id, 
            original_name as "originalName", 
            stored_name as "storedName", 
            record_count as "recordCount"
          FROM analyzed_files
          ORDER BY id DESC
        `);
        
        return result.rows.map(row => ({
          ...row,
          evaluationMetrics: null
        }));
      } catch (fallbackError) {
        console.error("All analyzed files queries failed:", fallbackError);
        return [];
      }
    }
  }

  async getAnalyzedFile(id: number): Promise<AnalyzedFile | undefined> {
    const [file] = await db.select()
      .from(analyzedFiles)
      .where(eq(analyzedFiles.id, id));
    return file;
  }

  async createAnalyzedFile(file: InsertAnalyzedFile): Promise<AnalyzedFile> {
    try {
      // Prepare the insert data, avoiding timestamp field if it doesn't exist
      const insertData = {
        originalName: file.originalName,
        storedName: file.storedName,
        recordCount: file.recordCount,
        evaluationMetrics: JSON.stringify(file.evaluationMetrics || null)
      };
      
      // Try to use ORM first
      try {
        const [result] = await db.insert(analyzedFiles)
          .values(insertData)
          .returning();
        return result;
      } catch (error) {
        console.error("Error inserting analyzed file with ORM:", error);
        
        // If ORM fails, try direct SQL insert instead
        const result = await pool.query(`
          INSERT INTO analyzed_files (
            original_name, 
            stored_name, 
            record_count
          ) VALUES ($1, $2, $3)
          RETURNING 
            id, 
            original_name as "originalName", 
            stored_name as "storedName",
            record_count as "recordCount"
        `, [
          file.originalName,
          file.storedName,
          file.recordCount
        ]);
        
        if (result.rows.length > 0) {
          console.log("Created analyzed file via direct SQL:", result.rows[0]);
          return {
            ...result.rows[0],
            evaluationMetrics: null
          };
        } else {
          throw new Error("Failed to create analyzed file");
        }
      }
    } catch (error) {
      console.error("All attempts to create analyzed file failed:", error);
      throw error;
    }
  }

  async deleteAnalyzedFile(id: number): Promise<void> {
    try {
      // First delete all the sentiment posts that belong to this file
      console.log(`Deleting all sentiment posts for file ID ${id}`);
      await this.deleteSentimentPostsByFileId(id);
      
      // Then delete any upload sessions that reference this file
      try {
        console.log(`Deleting upload sessions for file ID ${id}`);
        await db.delete(uploadSessions)
          .where(eq(uploadSessions.fileId, id));
      } catch (uploadSessionError) {
        console.error(`Error deleting upload sessions for file ID ${id}:`, uploadSessionError);
        // Continue with the file deletion anyway
      }
      
      // Use raw SQL to delete the file to handle database schema differences
      try {
        // Then delete the analyzed file record
        console.log(`Deleting analyzed file with ID ${id} using ORM`);
        await db.delete(analyzedFiles)
          .where(eq(analyzedFiles.id, id));
      } catch (ormError) {
        console.error(`ORM error deleting file ID ${id}, falling back to direct SQL:`, ormError);
        
        // Fallback to direct SQL which is more flexible with schema differences
        console.log(`Trying direct SQL for file ID ${id} deletion`);
        await db.execute(sql`DELETE FROM analyzed_files WHERE id = ${id}`);
      }
        
      console.log(`Successfully deleted file ID ${id} and all related posts and sessions`);
    } catch (error) {
      console.error(`Error in cascading delete of file ID ${id}:`, error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
  async updateFileMetrics(fileId: number, metrics: any): Promise<void> {
    await db.update(analyzedFiles)
      .set({
        evaluationMetrics: JSON.stringify(metrics)
      })
      .where(eq(analyzedFiles.id, fileId));
  }

  // Delete functions
  async deleteAllSentimentPosts(): Promise<void> {
    await db.delete(sentimentPosts);
  }

  async deleteAllDisasterEvents(): Promise<void> {
    await db.delete(disasterEvents);
  }

  async deleteAllAnalyzedFiles(): Promise<void> {
    await db.delete(analyzedFiles);
  }

  // Profile Images
  async getProfileImages(): Promise<ProfileImage[]> {
    return db.select().from(profileImages);
  }

  async createProfileImage(profile: InsertProfileImage): Promise<ProfileImage> {
    const [result] = await db.insert(profileImages)
      .values(profile)
      .returning();
    return result;
  }

  // Sentiment Feedback Training 
  async getSentimentFeedback(): Promise<SentimentFeedback[]> {
    return db.select().from(sentimentFeedback);
  }

  async getUntrainedFeedback(): Promise<SentimentFeedback[]> {
    return db.select()
      .from(sentimentFeedback)
      .where(eq(sentimentFeedback.trainedOn, false));
  }

  async submitSentimentFeedback(feedback: InsertSentimentFeedback): Promise<SentimentFeedback> {
    const [result] = await db.insert(sentimentFeedback)
      .values(feedback)
      .returning();
    return result;
  }

  async markFeedbackAsTrained(id: number): Promise<void> {
    await db.update(sentimentFeedback)
      .set({ trainedOn: true })
      .where(eq(sentimentFeedback.id, id));
  }

  // Training Examples
  async getTrainingExamples(): Promise<TrainingExample[]> {
    try {
      return db.select().from(trainingExamples);
    } catch (error) {
      console.error("Error in getTrainingExamples (table may not exist):", error);
      // Return empty array if table doesn't exist
      return [];
    }
  }

  async getTrainingExampleByText(text: string): Promise<TrainingExample | undefined> {
    try {
      // Generate text_key similar to how it's done in Python backend
      const textWords = text.toLowerCase().match(/\b\w+\b/g) || [];
      const textKey = textWords.join(' ');
      
      const [example] = await db.select()
        .from(trainingExamples)
        .where(eq(trainingExamples.textKey, textKey));
      
      return example;
    } catch (error) {
      console.error("Error in getTrainingExampleByText (table may not exist):", error);
      // Return undefined if table doesn't exist
      return undefined;
    }
  }

  async createTrainingExample(example: InsertTrainingExample): Promise<TrainingExample> {
    try {
      // Attempt to find an existing entry first
      const existingExample = await this.getTrainingExampleByText(example.text);
      
      if (existingExample) {
        // If example already exists, update it rather than creating a new one
        return this.updateTrainingExample(existingExample.id, example.sentiment);
      }
      
      // Create a new training example
      const [result] = await db.insert(trainingExamples)
        .values(example)
        .returning();
      
      return result;
    } catch (error) {
      console.error("Error in createTrainingExample (table may not exist):", error);
      // Return a mock example since the table doesn't exist
      return {
        id: -1,
        text: example.text,
        textKey: example.textKey,
        sentiment: example.sentiment,
        language: example.language,
        confidence: example.confidence || 0.95,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  async updateTrainingExample(id: number, sentiment: string): Promise<TrainingExample> {
    try {
      const [result] = await db.update(trainingExamples)
        .set({ 
          sentiment, 
          updatedAt: new Date() 
        })
        .where(eq(trainingExamples.id, id))
        .returning();
      
      return result;
    } catch (error) {
      console.error("Error in updateTrainingExample (table may not exist):", error);
      // Return a mock example since the table doesn't exist
      return {
        id: id,
        text: "Example not saved - database error",
        textKey: "example not saved",
        sentiment: sentiment,
        language: "unknown",
        confidence: 0.95,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  async deleteTrainingExample(id: number): Promise<void> {
    try {
      await db.delete(trainingExamples)
        .where(eq(trainingExamples.id, id));
    } catch (error) {
      console.error("Error in deleteTrainingExample (table may not exist):", error);
      // Just log the error, no need to throw
    }
  }

  // Upload Sessions Management
  async getUploadSession(sessionId: string): Promise<UploadSession | undefined> {
    try {
      const result = await pool.query(`
        SELECT * FROM upload_sessions WHERE session_id = $1
      `, [sessionId]);
      
      return result.rows[0];
    } catch (error) {
      console.error("Error in getUploadSession (table may not exist):", error);
      return undefined;
    }
  }
  
  async getAllActiveSessions(): Promise<UploadSession[]> {
    try {
      const result = await pool.query(`
        SELECT * FROM upload_sessions WHERE status = 'active'
      `);
      
      return result.rows;
    } catch (error) {
      console.error("Error in getAllActiveSessions (table may not exist):", error);
      return []; // Return empty array if error
    }
  }

  async createUploadSession(session: InsertUploadSession): Promise<UploadSession> {
    try {
      // Using simplest approach - no server_start_timestamp
      const result = await pool.query(`
        INSERT INTO upload_sessions 
          (session_id, status, progress, file_id, user_id, created_at, updated_at)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        session.sessionId,
        session.status || 'active',
        session.progress ? JSON.stringify(session.progress) : null,
        session.fileId || null,
        session.userId || null,
        new Date(),
        new Date()
      ]);

      return result.rows[0];
    } catch (error) {
      console.error("Error in createUploadSession (table may not exist):", error);
      // Return a mock session since the table might not exist
      return {
        id: -1,
        sessionId: session.sessionId,
        status: session.status || 'active',
        fileId: session.fileId || null,  // Ensure fileId is null if undefined
        progress: session.progress,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: session.userId || null,   // Ensure userId is null if undefined
        serverStartTimestamp: session.serverStartTimestamp || null  // Add this to match expected type
      };
    }
  }

  async updateUploadSession(sessionId: string, status: string, progress: any): Promise<UploadSession | undefined> {
    try {
      // Use the simple, reliable update without server_start_timestamp
      const result = await pool.query(`
        UPDATE upload_sessions
        SET status = $1, progress = $2, updated_at = $3
        WHERE session_id = $4
        RETURNING *
      `, [
        status,
        progress ? JSON.stringify(progress) : null,
        new Date(),
        sessionId
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error("Error in updateUploadSession (table may not exist):", error);
      return undefined;
    }
  }

  async deleteUploadSession(sessionId: string): Promise<void> {
    try {
      await pool.query(`
        DELETE FROM upload_sessions WHERE session_id = $1
      `, [sessionId]);
    } catch (error) {
      console.error("Error in deleteUploadSession (table may not exist):", error);
      // Just log the error, no need to throw
    }
  }

  async deleteAllData(): Promise<void> {
    await db.delete(sentimentFeedback);
    await db.delete(trainingExamples);
    await db.delete(uploadSessions);
    await this.deleteAllSentimentPosts();
    await this.deleteAllDisasterEvents();
    await this.deleteAllAnalyzedFiles();
  }
}

export const storage = new DatabaseStorage();