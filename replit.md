# PanicSense - Disaster Sentiment Analysis Platform

## Overview

PanicSense is a disaster sentiment analysis platform designed specifically for the Philippines. It monitors and analyzes social media posts (primarily Twitter/X) to detect disaster-related content, assess emotional urgency, and identify potential emergency situations in real-time. The system uses AI-powered sentiment analysis to process bilingual (Tagalog-English/Taglish) content, helping authorities and communities respond more effectively to natural disasters like typhoons, earthquakes, floods, and other emergencies.

## Recent Changes (October 30, 2025)

### Major Code Organization & Deployment Improvements (Latest - October 30, 2025)
- **TypeScript Migration**: Converted all .js files to .ts for type safety
  - Migrated `permanent-admin.js` → `permanent-admin.ts`
  - Migrated `user-cleanup-route.js` → `user-cleanup-route.ts`
  - Added proper type definitions and improved code quality
  - Fixed all TypeScript LSP errors
- **Security Enhancements**: 
  - Implemented proper password hashing with bcrypt
  - Added environment variable support for admin credentials
  - Warnings for production deployments with default passwords
  - Removed hardcoded credentials in favor of .env configuration
- **Documentation Suite Created**:
  - `README.md` - Comprehensive project documentation with features, setup, and usage
  - `DEPLOYMENT.md` - Platform-specific deployment guides (Render, Railway, Heroku, Vercel, AWS, GCP, Docker)
  - `.env.example` - Complete environment variable template with detailed comments
- **Deployment Scripts Added**:
  - `scripts/setup.sh` - Automated initial setup script
  - `scripts/deploy.sh` - Multi-platform deployment helper
  - `server/index-wrapper.js` - Production entry point with error handling
- **Project Structure Optimization**:
  - Added .gitkeep files to necessary empty directories
  - Cleaned up unused directories
  - Verified build configuration for production readiness
  - Optimized package.json scripts for different deployment scenarios
- **Build & Production Readiness**:
  - Verified Vite, TypeScript, and Drizzle configurations
  - Optimized build process for cloud deployment
  - Added multiple start commands for different platforms (Render, Railway, Heroku)
  - Improved error handling in production mode

### Twitter Fetching AI Algorithm Update (Latest - October 30, 2025)
- **AI Model Separation**:
  - Twitter fetching: Regular Groq API with `llama-3.1-8b-instant` (unlimited, fast)
  - Real-time analysis: Groq Compound AI with web search (250 tokens/day limit)
- **Unified AI Prompts**: Twitter and real-time use EXACT SAME prompts
  - Same sentiment classification rules (Panic, Fear/Anxiety, Disbelief, Resilience, Neutral)
  - Same language support (English, Tagalog, Taglish)
  - Twitter version excludes explanation field (not needed)
  - Local language detection before AI call
- **Rate Limiting**: Added 3-second delays between processing each tweet
  - Applied to both batch processing and streaming endpoints
  - Consistent pacing even on errors
- **Progressive UI**: Streaming endpoint shows tweets one by one as analyzed
  - Frontend EventSource displays each tweet immediately upon processing
  - Users see results progressively instead of waiting for all tweets

### System Cleanup and Optimization
- **Removed legacy deployment files**: Deleted Procfile, render-requirements.txt, run.js (deployment managed via Replit)
- **Cleaned up duplicate components**: Removed duplicate admin-login.jsx in favor of unified auth/login.tsx
- **Removed unused data**: Deleted attached_assets folder and test CSV files
- **Updated .gitignore**: Added comprehensive patterns for Python libs, temp files, and uploads
- **Fixed Python LSP errors**: Added type safety improvements to groq_compound.py
- **Dependency management**: Updated npm packages where compatible, maintained stability by avoiding breaking changes

### Code Organization
- **Groq API utilities**: Maintained specialized structure (groq-api.ts for general use, groq-compound.ts for Twitter analysis, groq-config.ts for configuration)
- **Improved file structure**: Cleaner codebase with unnecessary files removed
- **Better documentation**: Enhanced .gitignore and maintained up-to-date replit.md

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript as the primary UI framework
- Vite as the build tool and development server
- TailwindCSS for styling with custom theme configuration
- Radix UI components for accessible, professional UI elements
- TanStack Query for server state management
- React Hook Form with Zod resolvers for form validation

**Design Pattern:**
The frontend follows a component-based architecture with a clear separation between presentation and business logic. The `client/` directory houses all frontend code, with static assets served from `public/`. The application uses a professional design variant with a light appearance theme, configured through `theme.json`.

**Key Components (Updated October 30, 2025):**
- Real-time page (`client/src/pages/real-time.tsx`) displays analyzed Twitter posts with full metadata
- `RealtimePostsFeed` component (`client/src/components/realtime/realtime-posts-feed.tsx`) shows latest analyzed posts with timestamp, source, link, location, disaster type, emotion, sentiment, confidence, and language
- Component sourced from correct GitHub repository: https://github.com/draiimon/PanicSensePH (not PanicSense)

**Rationale:**
React with TypeScript provides type safety and excellent developer experience. Vite offers fast hot module replacement during development and optimized production builds. The Radix UI + TailwindCSS combination enables rapid development of accessible, professionally-styled interfaces without sacrificing customization.

### Backend Architecture

**Technology Stack:**
- Node.js with Express as the web server
- TypeScript for type-safe server code
- PostgreSQL (via Neon) as the primary database
- Drizzle ORM for database operations
- WebSocket support for real-time communication
- Python integration for advanced AI/ML processing

**API Structure:**
The backend follows a modular route-based architecture with specialized route handlers:
- `routes.ts` - Main routing logic and WebSocket setup
- `routes/admin.ts` - Administrative endpoints
- `routes/twitter-routes.ts` - Twitter/social media integration
- `routes/text-processing.ts` - Text analysis endpoints
- `routes/real-news-routes.ts` - Real news verification

**Server Entry Points:**
The system supports multiple deployment environments with specialized entry points:
- `server/index.ts` - Primary TypeScript server (development)
- `server/index.js` - CommonJS fallback for production
- `index.js` - Production entry point for Render.com deployment
- `server.js` - Alternative simple server configuration

**Python Integration:**
The `python-service.ts` manages subprocess communication with Python scripts for AI-powered sentiment analysis. Python scripts handle:
- Text preprocessing with emoji preservation
- Sentiment classification using TextBlob and custom models
- Language detection for bilingual content
- Confidence scoring and urgency assessment

**Pros:**
- Modular architecture enables independent scaling of components
- TypeScript provides type safety across the stack
- Python integration allows leveraging advanced ML libraries
- Multiple entry points support various deployment platforms

**Cons:**
- Complexity of managing both Node.js and Python processes
- Potential WebSocket timeout issues with serverless databases
- Build configuration requires careful coordination between Vite and ESBuild

### Data Storage Solutions

**Primary Database:**
PostgreSQL hosted on Neon (serverless PostgreSQL) with connection pooling via the `pg` library instead of WebSocket-based connections to avoid timeout issues.

**Database Schema:**
The schema is defined in `shared/schema.ts` using Drizzle ORM:

**Core Tables:**
- `users` - Authentication and user management (username, password, email, role)
- `sessions` - Session tokens for authentication
- `sentiment_posts` - Analyzed social media posts with sentiment data
- `analyzed_files` - Metadata for uploaded CSV files
- `upload_sessions` - Tracks file upload progress
- `disaster_events` - Disaster event records
- `sentiment_feedback` - User feedback on sentiment analysis accuracy
- `training_examples` - Data for model training and improvement
- `profile_images` - User profile images

**Migration Strategy:**
Drizzle Kit handles schema migrations with configuration in `drizzle.config.ts`. The system includes migration helpers (`migration-helper.js`) for data transfer between database instances.

**Connection Strategy:**
Instead of Neon's WebSocket-based serverless client, the system uses standard PostgreSQL connection pooling with:
- Maximum 5 concurrent connections
- 30-second idle timeout
- 5-second connection timeout
- SSL enforced for security

**Rationale:**
PostgreSQL provides robust ACID guarantees essential for disaster monitoring. Neon's serverless architecture offers cost-effective scaling. The standard connection pool approach avoids WebSocket timeout issues common in deployment environments like Render.com.

**Alternatives Considered:**
- Neon's serverless WebSocket client (abandoned due to timeout issues)
- SQLite (insufficient for multi-user concurrent access)
- MongoDB (lacks relational integrity needed for structured disaster data)

### Authentication and Authorization

**Mechanism:**
Session-based authentication with cryptographic tokens stored in the `sessions` table. Passwords are hashed using bcryptjs with a cost factor of 10.

**User Roles:**
- `admin` - Full system access (username: panicsenseadmin, password: 123456789)
- `user` - Standard user access

**Admin User Guarantee:**
Multiple redundancy mechanisms ensure the admin user always exists:
- `ensure-admin-user.js` - Startup check with Drizzle ORM and SQL fallbacks
- `permanent-admin.js` - Additional permanent admin verification
- `user-cleanup-route.js` - Cleanup endpoint that preserves admin account

**Security Considerations:**
The system uses hardcoded admin credentials for development/demo purposes. In a production environment, this should be replaced with secure credential management and environment variables.

## External Dependencies

### Third-Party APIs

**Anthropic Claude API:**
Integrated via `@anthropic-ai/sdk` for advanced natural language understanding, particularly for analyzing emotional urgency and disaster context in bilingual text.

**Twitter API:**
Configured through `routes/twitter-routes.ts` for real-time social media monitoring. The system fetches Philippines-specific disaster-related tweets using strict location-based queries. 

**Query Strategy (Updated October 30, 2025):**
- Strict query requires Philippine location keywords (Philippines, Manila, Cebu, Davao, Luzon, Visayas, Mindanao, etc.) paired with disaster terms
- Language parameter removed to allow proper auto-detection of English vs Tagalog/Taglish content
- Default language fallback changed from "tl" to "en" to avoid incorrectly marking all tweets as Tagalog
- AI model (Qwen 3 32B via Groq) performs accurate language detection during sentiment analysis

### AI/ML Libraries

**Python Dependencies** (from `render-requirements.txt`):
- `anthropic` - Claude AI integration
- `beautifulsoup4` - HTML parsing for web scraping
- `langdetect` - Language detection for bilingual content
- `nltk` - Natural language processing toolkit
- `textblob` - Simplified text analysis
- `scikit-learn` - Machine learning utilities
- `torch` - PyTorch for deep learning models
- `numpy`/`pandas` - Data processing

**Text Processing Strategy:**
The system preserves emotional indicators during preprocessing:
- ALL CAPS preservation for panic detection
- Exclamation mark counting for urgency assessment
- Emoji conversion to descriptive text using Hugging Face lexicon
- Taglish (Tagalog-English mix) preservation

### Database Service

**Neon PostgreSQL:**
Serverless PostgreSQL with two database instances referenced in code:
- Current: `ep-fancy-moon-a1b99crw-pooler.ap-southeast-1.aws.neon.tech`
- Legacy: `ep-still-snow-09343008-pooler.ap-southeast-1.aws.neon.tech`

Connection managed through environment variable `DATABASE_URL` with SSL enforcement.

### Deployment Platforms

**Render.com:**
Primary deployment target with specialized build configuration:
- Custom build scripts (`render-setup.sh`, `build.sh`)
- Python + Node.js runtime support
- Static file serving from `dist/public`

**Replit:**
Development environment with hot reload support and integrated debugging.

### File Upload and Processing

**Multer:**
Handles CSV file uploads with:
- 150MB file size limit (enhanced for large datasets)
- Memory and disk storage strategies
- CSV-only filtering

**Upload Session Management:**
Custom `upload-session-manager.ts` tracks multi-stage upload processing with real-time progress updates via WebSocket.

### Real-time Communication

**WebSocket (ws library):**
Provides bidirectional communication for:
- Upload progress streaming
- Real-time sentiment analysis updates
- Server-Sent Events (SSE) for live data feeds

**Connection Strategy:**
WebSocket server runs on the same HTTP server instance (path: `/ws`) to avoid port conflicts and simplify deployment.