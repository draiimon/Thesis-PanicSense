# 🚀 Deployment Guide for PanicSense

This comprehensive guide covers deploying PanicSense to various cloud platforms. The application is designed to be platform-agnostic and works seamlessly with most modern cloud providers.

---

## 📋 Table of Contents

1. [General Deployment Requirements](#general-deployment-requirements)
2. [Render.com](#rendercom)
3. [Railway](#railway)
4. [Heroku](#heroku)
5. [Vercel](#vercel)
6. [AWS (Elastic Beanstalk)](#aws-elastic-beanstalk)
7. [Google Cloud Platform](#google-cloud-platform)
8. [DigitalOcean App Platform](#digitalocean-app-platform)
9. [Docker Deployment](#docker-deployment)
10. [Replit](#replit)
11. [Post-Deployment Checklist](#post-deployment-checklist)
12. [Troubleshooting](#troubleshooting)

---

## 🔧 General Deployment Requirements

### Minimum Server Specifications

- **CPU**: 1 vCPU (2 vCPU recommended for production)
- **RAM**: 512 MB minimum (1 GB recommended)
- **Storage**: 1 GB minimum (for uploads and database)
- **Node.js**: 18.x or higher
- **Python**: 3.11 or higher

### Required Environment Variables

```env
# Essential
DATABASE_URL=your_postgresql_connection_string
GROQ_API_KEY=your_groq_api_key

# Security (Change in production!)
ADMIN_PASSWORD=your_secure_password

# Optional but Recommended
NODE_ENV=production
TWITTER_API_KEY=your_twitter_key
GROQ_MODEL=qwen/qwen3-32b
```

### Build Commands

```bash
# Install dependencies
npm install

# Build application
npm run build

# Database migration
npm run db:push
```

### Start Command

```bash
npm run start
```

---

## 🎨 Render.com

**Recommended for:** Easy deployment, automatic SSL, free tier available

### Step-by-Step Deployment

#### 1. Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `panicsense-db`
   - **Database**: `panicsense`
   - **User**: `panicsense_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free or Starter
4. Click **"Create Database"**
5. Copy the **Internal Database URL** (starts with `postgresql://`)

#### 2. Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:

```yaml
Name: panicsense
Environment: Node
Region: Same as database
Branch: main
Build Command: npm install && npm run build
Start Command: npm run start
```

#### 3. Add Environment Variables

Go to **Environment** tab and add:

```env
NODE_ENV=production
DATABASE_URL=<internal_database_url_from_step_1>
GROQ_API_KEY=<your_groq_api_key>
ADMIN_PASSWORD=<secure_password>
ADMIN_USERNAME=panicsenseadmin
ADMIN_EMAIL=admin@panicsense.ph
```

#### 4. Deploy

1. Click **"Create Web Service"**
2. Wait for build to complete (5-10 minutes)
3. Run database migration:
   - Go to **Shell** tab
   - Run: `npm run db:push`
4. Your app will be available at: `https://panicsense.onrender.com`

### Render-Specific Configuration

Render automatically sets the `PORT` environment variable. No additional configuration needed.

---

## 🚂 Railway

**Recommended for:** Simple deployment, generous free tier, good performance

### Step-by-Step Deployment

#### 1. Install Railway CLI (Optional)

```bash
npm install -g @railway/cli
railway login
```

#### 2. Create New Project

**Via Dashboard:**
1. Go to [Railway](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository

**Via CLI:**
```bash
railway init
```

#### 3. Add PostgreSQL

1. Click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will automatically create and link the database
3. The `DATABASE_URL` variable will be set automatically

#### 4. Configure Environment Variables

Go to your service → **Variables** tab:

```env
NODE_ENV=production
GROQ_API_KEY=<your_groq_api_key>
ADMIN_PASSWORD=<secure_password>
ADMIN_USERNAME=panicsenseadmin
ADMIN_EMAIL=admin@panicsense.ph
```

#### 5. Configure Build Settings

In **Settings** → **Build**:

```yaml
Build Command: npm install && npm run build
Start Command: npm run start
Watch Paths: /
```

#### 6. Deploy

Railway will automatically deploy on every push to your main branch.

To manually deploy:
```bash
railway up
```

Run migrations:
```bash
railway run npm run db:push
```

Your app will be available at: `https://your-project.railway.app`

---

## 💜 Heroku

**Recommended for:** Established platform, many add-ons

### Step-by-Step Deployment

#### 1. Install Heroku CLI

```bash
# macOS
brew install heroku/brew/heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh

# Windows
# Download from: https://devcenter.heroku.com/articles/heroku-cli
```

#### 2. Create Heroku App

```bash
heroku login
heroku create panicsense

# Add PostgreSQL
heroku addons:create heroku-postgresql:essential-0
```

#### 3. Set Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set GROQ_API_KEY=your_groq_api_key
heroku config:set ADMIN_PASSWORD=your_secure_password
heroku config:set ADMIN_USERNAME=panicsenseadmin
heroku config:set ADMIN_EMAIL=admin@panicsense.ph
```

#### 4. Add Python Buildpack

```bash
heroku buildpacks:add --index 1 heroku/python
heroku buildpacks:add --index 2 heroku/nodejs
```

#### 5. Deploy

```bash
git push heroku main
```

#### 6. Run Migrations

```bash
heroku run npm run db:push
```

#### 7. Open Application

```bash
heroku open
```

---

## ▲ Vercel

**Recommended for:** Edge deployments, global CDN

### ⚠️ Important Security Note

**CRITICAL**: Before deploying to ANY platform, ensure you set a secure `ADMIN_PASSWORD`:
- Minimum 12 characters required (16+ recommended)
- Generate secure password: `openssl rand -base64 24`
- The application will **refuse to start** in production without a secure password

### ⚠️ Platform Compatibility Note

Vercel is optimized for static sites and serverless functions. While PanicSense can run on Vercel, some features (WebSocket, long-running processes) may have limitations.

### Step-by-Step Deployment

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Configure vercel.json

Create `vercel.json` in your project root:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "outputDirectory": "dist/public",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

#### 3. Set Environment Variables

```bash
vercel env add DATABASE_URL
vercel env add GROQ_API_KEY
vercel env add ADMIN_PASSWORD
vercel env add NODE_ENV
```

#### 4. Deploy

```bash
vercel --prod
```

### Limitations on Vercel

- WebSocket connections limited
- Function timeout: 30 seconds (Pro plan)
- Not ideal for long-running background tasks
- Consider using Vercel Edge Functions for better performance

---

## ☁️ AWS (Elastic Beanstalk)

**Recommended for:** Enterprise deployments, AWS ecosystem integration

### Step-by-Step Deployment

#### 1. Install EB CLI

```bash
pip install awsebcli
```

#### 2. Initialize Elastic Beanstalk

```bash
eb init

# Select:
# - Region: Closest to your users
# - Application name: panicsense
# - Platform: Node.js 18 (or latest)
# - SSH: Yes (for debugging)
```

#### 3. Create Environment

```bash
eb create panicsense-prod

# Select:
# - Load balancer: Application Load Balancer
# - Spot fleet: No (for production)
```

#### 4. Add RDS PostgreSQL

```bash
# Go to AWS Console → RDS
# Create PostgreSQL instance
# Note the connection details

# Or use EB CLI
eb create --database.engine postgres --database.username admin
```

#### 5. Set Environment Variables

```bash
eb setenv NODE_ENV=production
eb setenv DATABASE_URL=postgresql://user:pass@host:5432/db
eb setenv GROQ_API_KEY=your_key
eb setenv ADMIN_PASSWORD=secure_password
```

#### 6. Configure .ebextensions

Create `.ebextensions/nodecommand.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm run start"
    NodeVersion: 18.x
  aws:elasticbeanstalk:application:environment:
    NPM_CONFIG_PRODUCTION: false
```

#### 7. Deploy

```bash
eb deploy
```

#### 8. Open Application

```bash
eb open
```

---

## 🌐 Google Cloud Platform

**Recommended for:** Google Cloud ecosystem, global infrastructure

### Deployment Options

#### Option 1: Cloud Run (Recommended)

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# Initialize
gcloud init

# Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/panicsense

# Deploy
gcloud run deploy panicsense \
  --image gcr.io/PROJECT_ID/panicsense \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GROQ_API_KEY=your_key"
```

#### Option 2: App Engine

Create `app.yaml`:

```yaml
runtime: nodejs18
env: standard
instance_class: F2

automatic_scaling:
  min_instances: 1
  max_instances: 10

env_variables:
  NODE_ENV: "production"
  GROQ_API_KEY: "your_key"
  ADMIN_PASSWORD: "secure_password"
```

Deploy:
```bash
gcloud app deploy
```

---

## 🌊 DigitalOcean App Platform

**Recommended for:** Balance of simplicity and features

### Step-by-Step Deployment

#### 1. Create App

1. Go to [DigitalOcean](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Connect GitHub repository

#### 2. Configure Resources

```yaml
# App Settings
Name: panicsense
Region: Choose closest region

# Build Configuration
Build Command: npm install && npm run build
Run Command: npm run start
HTTP Port: 5000
```

#### 3. Add Database

1. Click **"Add Resource"** → **"Database"**
2. Select **PostgreSQL**
3. Choose plan (Dev Database for testing, Managed Database for production)

#### 4. Set Environment Variables

```env
NODE_ENV=production
DATABASE_URL=${db.DATABASE_URL}
GROQ_API_KEY=your_key
ADMIN_PASSWORD=secure_password
```

#### 5. Deploy

Click **"Create Resources"** and wait for deployment.

---

## 🐳 Docker Deployment

**Recommended for:** Containerized deployments, self-hosted

### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install Python for ML scripts
RUN apk add --no-cache python3 py3-pip

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Python requirements
COPY server/python/requirements.txt ./server/python/
RUN pip3 install --no-cache-dir -r server/python/requirements.txt

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/migrations ./migrations

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start application
CMD ["npm", "run", "start"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:password@db:5432/panicsense
      GROQ_API_KEY: ${GROQ_API_KEY}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: panicsense
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Deploy with Docker

```bash
# Build image
docker build -t panicsense .

# Run with Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec app npm run db:push

# View logs
docker-compose logs -f app
```

---

## 🔄 Replit

**Recommended for:** Quick prototyping, development

### Step-by-Step Setup

#### 1. Fork or Import

- Fork this Repl, or
- Import from GitHub: `https://github.com/yourusername/panicsense`

#### 2. Configure Secrets

Go to **Tools** → **Secrets** and add:

```env
DATABASE_URL=<from_replit_postgres>
GROQ_API_KEY=your_key
ADMIN_PASSWORD=secure_password
NODE_ENV=development
```

#### 3. Configure Run Command

In `.replit` file:

```toml
run = "npm run dev"

[deployment]
run = ["npm", "run", "start"]
build = ["npm", "run", "build"]
```

#### 4. Add PostgreSQL

1. Click **Database** icon in left sidebar
2. Replit will provision a PostgreSQL database
3. `DATABASE_URL` will be automatically added to Secrets

#### 5. Run

Click **Run** button. The application will start on port 5000.

---

## ✅ Post-Deployment Checklist

After deploying to any platform:

- [ ] Verify application is accessible via HTTPS
- [ ] Test admin login with configured credentials
- [ ] Run database migrations: `npm run db:push`
- [ ] Verify environment variables are set correctly
- [ ] Test sentiment analysis functionality
- [ ] Check Twitter integration (if configured)
- [ ] Monitor application logs for errors
- [ ] Set up database backups
- [ ] Configure monitoring and alerts
- [ ] Set up custom domain (if applicable)
- [ ] Enable CDN for static assets
- [ ] Review security headers and CORS settings
- [ ] Load test with expected traffic

---

## 🐛 Troubleshooting

### Application Won't Start

**Symptoms:** App crashes immediately after deployment

**Solutions:**
1. Check logs for error messages
2. Verify `DATABASE_URL` is correct
3. Ensure `GROQ_API_KEY` is set
4. Verify Python is installed (for ML features)
5. Check port binding (should be from `process.env.PORT`)

```bash
# View logs on most platforms
npm run start 2>&1 | tee app.log
```

### Database Connection Errors

**Symptoms:** "Connection refused" or "SSL required"

**Solutions:**
1. Verify database URL includes `?sslmode=require`
2. Check database is in same region as app
3. Verify firewall rules allow connection
4. Test connection manually:

```bash
psql $DATABASE_URL
```

### Python Scripts Failing

**Symptoms:** Sentiment analysis returns errors

**Solutions:**
1. Verify Python 3.11+ is installed
2. Install Python dependencies:
   ```bash
   pip install -r server/python/requirements.txt
   ```
3. Check `PYTHON_PATH` environment variable
4. Verify Groq API key is valid

### Out of Memory Errors

**Symptoms:** App crashes with "JavaScript heap out of memory"

**Solutions:**
1. Increase memory allocation:
   ```bash
   NODE_OPTIONS="--max-old-space-size=2048"
   ```
2. Upgrade to larger instance
3. Optimize batch processing sizes
4. Enable database connection pooling

### Slow Performance

**Symptoms:** Long response times, timeouts

**Solutions:**
1. Enable database indexes (run migrations)
2. Configure Redis caching (optional)
3. Use CDN for static assets
4. Enable compression middleware
5. Optimize SQL queries
6. Scale horizontally (add more instances)

### Build Failures

**Symptoms:** Deployment fails during build

**Solutions:**
1. Clear build cache
2. Verify `package.json` scripts are correct
3. Check TypeScript compilation errors
4. Ensure all dependencies are in `package.json`

```bash
# Clean build
rm -rf node_modules dist
npm install
npm run build
```

---

## 📊 Performance Optimization

### Production Recommendations

1. **Enable Caching**
   - Use Redis for session storage
   - Cache API responses
   - Enable HTTP caching headers

2. **Database Optimization**
   - Enable connection pooling (already configured)
   - Add appropriate indexes
   - Use read replicas for heavy read traffic

3. **CDN Configuration**
   - Serve static assets via CDN
   - Enable gzip/brotli compression
   - Set appropriate cache headers

4. **Monitoring**
   - Set up application monitoring (DataDog, New Relic, etc.)
   - Configure error tracking (Sentry)
   - Set up uptime monitoring
   - Enable database query monitoring

5. **Scaling Strategy**
   - Horizontal scaling (multiple instances)
   - Load balancing
   - Auto-scaling based on CPU/memory usage
   - Database read replicas

---

## 🔒 Security Hardening

### Production Security Checklist

- [ ] Change default admin password
- [ ] Enable HTTPS only
- [ ] Set secure session cookies
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up WAF (Web Application Firewall)
- [ ] Regular dependency updates
- [ ] Enable database encryption
- [ ] Implement API key rotation
- [ ] Set up security monitoring

---

## 📞 Support

If you encounter issues not covered in this guide:

- Check [GitHub Issues](https://github.com/yourusername/panicsense/issues)
- Review application logs
- Consult platform-specific documentation
- Contact support: admin@panicsense.ph

---

**Happy Deploying! 🚀**
