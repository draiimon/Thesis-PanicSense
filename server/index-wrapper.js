/**
 * Production Entry Point for PanicSense
 * 
 * This wrapper handles starting the production server with proper
 * module resolution and error handling.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Set production environment
process.env.NODE_ENV = 'production';

console.log('🚀 Starting PanicSense in production mode...');
console.log('📁 Working directory:', process.cwd());
console.log('🌍 Node version:', process.version);
console.log('⚙️  Environment:', process.env.NODE_ENV);

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  console.error('Please configure DATABASE_URL before starting the application.');
  process.exit(1);
}

if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️  WARNING: GROQ_API_KEY is not set. Sentiment analysis may not work properly.');
}

// Import and start the main server
try {
  // For production builds, import from dist
  if (process.env.USE_DIST === 'true') {
    console.log('📦 Loading from dist/index.js...');
    await import('../dist/index.js');
  } else {
    // Fallback to server/index.ts for direct execution
    console.log('📦 Loading from server/index.ts...');
    const tsx = require('tsx/cjs/api');
    tsx.register();
    await import('./index.ts');
  }
} catch (error) {
  console.error('❌ Failed to start server:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
