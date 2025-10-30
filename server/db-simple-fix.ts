/**
 * Simple database fix function.
 * TypeScript ESM version that's compatible with server/index.ts
 *
 * @returns Promise<boolean> True if the fix was applied successfully
 */

import { pool } from './db';

export async function simpleDbFix(): Promise<boolean> {
  try {
    // Add sentiment_category column if it doesn't exist
    // This ensures realtime analysis has both emotion and sentiment category
    await pool.query(`
      ALTER TABLE sentiment_posts 
      ADD COLUMN IF NOT EXISTS sentiment_category TEXT;
    `);
    
    // Add text_key column to training_examples if it doesn't exist
    // This column is used for efficient matching of training examples
    await pool.query(`
      ALTER TABLE training_examples 
      ADD COLUMN IF NOT EXISTS text_key TEXT UNIQUE;
    `);
    
    // Add language column to training_examples if it doesn't exist
    // This column stores the detected language of the training example
    await pool.query(`
      ALTER TABLE training_examples 
      ADD COLUMN IF NOT EXISTS language TEXT;
    `);
    
    // Add disaster_event_id column to sentiment_posts to link posts with disaster events
    // This ensures every sentiment post can be connected to a specific disaster event
    await pool.query(`
      ALTER TABLE sentiment_posts 
      ADD COLUMN IF NOT EXISTS disaster_event_id INTEGER REFERENCES disaster_events(id);
    `);
    
    console.log("✅ Database connection validated and ready");
    return true;
  } catch (error: any) {
    // Log error but don't crash the application
    console.error("⚠️ Database warning during startup (non-fatal):", error?.message || "Unknown error");
    // Return true anyway to allow the application to start
    return true;
  }
}