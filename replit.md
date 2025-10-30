# PanicSense - Disaster Sentiment Analysis Platform

## Overview

PanicSense is a disaster sentiment analysis platform for the Philippines. It monitors social media (primarily Twitter/X) to detect disaster-related content, assess emotional urgency, and identify emergency situations in real-time. The platform uses AI for bilingual (Tagalog-English/Taglish) sentiment analysis, aiding authorities and communities in responding to natural disasters like typhoons, earthquakes, and floods. Its purpose is to provide timely, actionable insights to improve disaster preparedness and response.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React with TypeScript, Vite, and TailwindCSS for styling, complemented by Radix UI components for accessibility. It follows a component-based architecture with a clear separation of concerns, using TanStack Query for server state management and React Hook Form with Zod for validation. The design is a professional light-themed variant.

### Backend Architecture

The backend is built with Node.js and Express, written in TypeScript. It uses PostgreSQL (Neon) as the primary database with Drizzle ORM. WebSocket support enables real-time communication. Python is integrated for advanced AI/ML processing, managing subprocess communication for sentiment analysis, text preprocessing, and language detection. The architecture is modular with specialized route handlers for admin, social media, text processing, and news verification. Multiple entry points exist to support various deployment environments like Render.com.

### Data Storage Solutions

The primary database is PostgreSQL, hosted on Neon (serverless PostgreSQL). The system uses standard PostgreSQL connection pooling (max 5 connections, 30s idle timeout, 5s connection timeout, SSL enforced) to avoid WebSocket-related timeout issues. The schema is defined using Drizzle ORM in `shared/schema.ts`, including tables for users, sessions, sentiment posts, analyzed files, disaster events, and training data. Drizzle Kit handles schema migrations.

### Authentication and Authorization

The system uses session-based authentication with cryptographic tokens. Passwords are hashed with bcryptjs. There are `admin` and `user` roles. Mechanisms are in place to ensure the persistence of the admin user for system management.

## External Dependencies

### Third-Party APIs

- **Anthropic Claude API:** Integrated via `@anthropic-ai/sdk` for advanced natural language understanding and emotional urgency analysis in bilingual text.
- **Twitter API:** Used for real-time social media monitoring, fetching disaster-related tweets specifically from the Philippines using location-based queries. The system allows for auto-detection of English, Tagalog, and Taglish content.
- **Groq API:** Utilized for AI processing, specifically `llama-3.1-8b-instant` for general Twitter fetching and Groq Compound AI with web search for real-time analysis.

### AI/ML Libraries (Python)

Key Python libraries include `anthropic` (Claude AI), `beautifulsoup4` (web scraping), `langdetect` (language detection), `nltk` (NLP), `textblob` (text analysis), `scikit-learn` (ML utilities), `torch` (deep learning), `numpy`, and `pandas` (data processing). Text processing preserves emotional indicators like ALL CAPS, exclamation marks, and emojis, and handles Taglish content.

### Database Service

- **Neon PostgreSQL:** Serverless PostgreSQL is used, with the current instance being `ep-fancy-moon-a1b99crw-pooler.ap-southeast-1.aws.neon.tech`. Connection is managed via the `DATABASE_URL` environment variable with SSL.

### Deployment Platforms

- **Render.com:** Primary deployment target with custom build scripts for Python and Node.js.
- **Replit:** Used as the development environment.

### File Upload and Processing

- **Multer:** Handles CSV file uploads (up to 150MB) with filtering for CSV files only.
- **Upload Session Manager:** Manages multi-stage upload progress with real-time updates via WebSocket.

### Real-time Communication

- **WebSocket (ws library):** Provides bidirectional communication for streaming upload progress, real-time sentiment analysis updates, and Server-Sent Events (SSE) for live data feeds.