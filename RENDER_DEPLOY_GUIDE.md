# 🚀 PanicSense Render Deployment Guide

Complete guide to deploying PanicSense to Render.com

## 📋 Prerequisites

Before deploying to Render, ensure you have:

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Groq API Key** - Get from [console.groq.com](https://console.groq.com)
4. **Admin Password** - Create a secure password (16+ characters recommended)

---

## 🎯 Quick Deploy (Recommended)

### Option 1: Using render.yaml (Blueprint Deploy)

This is the **FASTEST** method - Render automatically configures everything!

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click **"New +"** → **"Blueprint"**

3. **Connect Repository**
   - Select your GitHub repository
   - Render will detect `render.yaml` automatically
   - Click **"Apply"**

4. **Set Required Environment Variables**
   
   Render will prompt you for these secrets:
   
   - `GROQ_API_KEY` - Your Groq API key from console.groq.com
   - `ADMIN_PASSWORD` - Secure admin password (16+ characters)
   
   Everything else is configured automatically in `render.yaml`!

5. **Deploy**
   - Click **"Create New Resources"**
   - Render will create:
     - PostgreSQL database
     - Web service
     - Environment variables
   - Wait 5-10 minutes for the build to complete

6. **Access Your App**
   - Your app will be live at: `https://panicsense.onrender.com`
   - Or your custom domain if configured

---

## 🔧 Manual Deploy (Alternative)

If you prefer manual setup or need custom configuration:

### Step 1: Create PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `panicsense-db`
   - **Database:** `panicsense`
   - **Plan:** Free (or your preferred plan)
   - **Region:** Oregon (or closest to you)
3. Click **"Create Database"**
4. **Save the connection string** (Internal Database URL)

### Step 2: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Select **"Build and deploy from a Git repository"**
3. Connect your GitHub repository
4. Configure service:

   **Basic Settings:**
   - **Name:** `panicsense`
   - **Region:** Oregon (match your database region)
   - **Branch:** `main` (or your production branch)
   - **Runtime:** Node
   - **Plan:** Free (or your preferred plan)

   **Build & Deploy:**
   - **Build Command:**
     ```bash
     chmod +x ./scripts/render-build.sh && ./scripts/render-build.sh
     ```
   
   - **Start Command:**
     ```bash
     npm start
     ```

### Step 3: Configure Environment Variables

Click **"Advanced"** → **"Environment Variables"** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `10000` | Auto-set by Render |
| `DATABASE_URL` | *Paste from Step 1* | Your PostgreSQL connection string |
| `GROQ_API_KEY` | *Your API key* | From console.groq.com |
| `ADMIN_PASSWORD` | *Your secure password* | 16+ characters recommended |
| `ADMIN_USERNAME` | `panicsenseadmin` | Optional (default shown) |
| `ADMIN_EMAIL` | `admin@panicsense.ph` | Optional |

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render starts building your app
3. Monitor build logs in real-time
4. Wait for "Live" status (5-10 minutes)

---

## ✅ Post-Deployment Verification

### 1. Check Build Logs

Look for these success indicators:
```
✅ Frontend build successful - dist/public directory exists
✅ Build process completed successfully!
```

### 2. Test Your Application

1. **Visit your app URL:** `https://your-app-name.onrender.com`
2. **Test admin login:**
   - Go to `/login`
   - Username: `panicsenseadmin` (or your custom username)
   - Password: Your `ADMIN_PASSWORD`
3. **Check features:**
   - Real-time news feed loading
   - Sentiment analysis working
   - Map visualization displaying
   - Dashboard showing data

### 3. Database Verification

```bash
# Connect to your Render PostgreSQL (from Render Dashboard)
# Check tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

# Should show: users, sentiment_posts, disaster_events, etc.
```

---

## 🔍 Troubleshooting

### Build Fails

**Problem:** Build fails with "Module not found" errors

**Solution:**
```bash
# Ensure all dependencies are in package.json
npm install --save <missing-package>
git commit -am "Add missing dependency"
git push
```

**Problem:** Python dependencies fail to install

**Solution:** 
- Python packages are optional for basic functionality
- The build script continues even if Python fails
- ML features may be limited without Python

### Deployment Fails

**Problem:** Deploy fails with "Port binding failed"

**Solution:** 
- ✅ Already configured correctly in `server/index.ts`
- Server binds to `0.0.0.0:10000` (Render's requirement)
- No action needed - this is already set up!

**Problem:** Database connection errors

**Solution:**
```bash
# Verify DATABASE_URL is set correctly
# In Render Dashboard → Environment → DATABASE_URL
# Format: postgresql://user:pass@host:port/database?sslmode=require
```

### Runtime Errors

**Problem:** "GROQ_API_KEY not set" warning

**Solution:**
- Add `GROQ_API_KEY` in Render Dashboard
- Environment → Add Environment Variable
- Redeploy service

**Problem:** Admin login fails

**Solution:**
- Verify `ADMIN_PASSWORD` is set in environment variables
- Password must be 12+ characters
- Default password "123456789" is blocked in production

### Performance Issues

**Problem:** App is slow to respond (Free tier)

**Solution:**
- Free tier apps sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Upgrade to paid plan for always-on service
- Or use a service like UptimeRobot to ping your app

---

## 🔐 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files
- ✅ Use Render's environment variable manager
- ✅ Rotate `ADMIN_PASSWORD` regularly
- ✅ Use strong passwords (16+ characters, mixed case, numbers, symbols)

### 2. Database Security
- ✅ Use SSL connections (already configured)
- ✅ Don't expose DATABASE_URL publicly
- ✅ Regular backups (Render does this automatically on paid plans)

### 3. API Keys
- ✅ Store in Render environment variables, not in code
- ✅ Monitor API usage to detect unauthorized access
- ✅ Rotate keys if compromised

---

## 📊 Monitoring & Logs

### View Logs

**Real-time logs:**
1. Go to your service in Render Dashboard
2. Click **"Logs"** tab
3. Watch live application logs

**Search logs:**
```bash
# In Render logs, filter for:
Error logs: Search "ERROR" or "❌"
API requests: Search "GET /api" or "POST /api"
Database: Search "database" or "PostgreSQL"
```

### Metrics

Render provides:
- **CPU usage**
- **Memory usage**
- **Request count**
- **Response time**
- **Error rate**

Access: Dashboard → Your Service → Metrics tab

---

## 🎨 Custom Domain Setup

### Add Custom Domain

1. **In Render Dashboard:**
   - Go to your web service
   - Click **"Settings"** → **"Custom Domains"**
   - Click **"Add Custom Domain"**

2. **Enter your domain:**
   - Example: `panicsense.ph` or `app.panicsense.ph`

3. **Update DNS records:**
   
   Add these records to your domain registrar:
   
   **For root domain (panicsense.ph):**
   ```
   Type: A
   Name: @
   Value: 216.24.57.1
   ```
   
   **For subdomain (app.panicsense.ph):**
   ```
   Type: CNAME
   Name: app
   Value: your-app-name.onrender.com
   ```

4. **Wait for SSL certificate:**
   - Render automatically provisions SSL
   - Takes 5-15 minutes
   - Your app will be accessible via HTTPS

---

## 💰 Cost Breakdown

### Free Tier
- **Web Service:** FREE (with limitations)
  - 512 MB RAM
  - Sleeps after 15 min inactivity
  - 750 hours/month free
  
- **PostgreSQL:** FREE
  - 1 GB storage
  - 90 days data retention
  - Automatic backups

- **Bandwidth:** FREE
  - 100 GB/month

### Paid Plans (Optional)

**Starter Plan ($7/month):**
- Always-on (no sleep)
- 512 MB RAM
- Better performance

**Standard Plan ($25/month):**
- 2 GB RAM
- Auto-scaling
- Priority support

**Database ($7/month):**
- 5 GB storage
- 1 year data retention
- Daily backups

---

## 🚀 CI/CD & Auto-Deploy

### Enable Auto-Deploy

**Already configured in render.yaml:**
```yaml
autoDeploy: true
```

This means:
- Every push to `main` branch = automatic deployment
- No manual intervention needed
- Full CI/CD pipeline

### Disable Auto-Deploy (if needed)

1. Go to service settings
2. Uncheck **"Auto-Deploy"**
3. Manually trigger deploys from dashboard

---

## 📱 Scaling & Performance

### Horizontal Scaling

Upgrade to Standard plan for:
- Multiple instances
- Load balancing
- Auto-scaling based on traffic

### Vertical Scaling

Increase resources:
1. Dashboard → Your Service → Settings
2. Change **Instance Type**
3. Options: Starter, Standard, Pro, Pro Plus

### Database Scaling

1. Dashboard → Your Database → Settings
2. Upgrade plan for:
   - More storage
   - Better performance
   - Advanced features

---

## 🔄 Updates & Maintenance

### Deploy New Version

```bash
# Make your changes
git add .
git commit -m "Add new feature"
git push origin main

# Render auto-deploys (if enabled)
# Or manually trigger from dashboard
```

### Database Migrations

```bash
# For schema changes, use Drizzle:
npm run db:push

# This pushes schema to production database
# Use with caution in production!
```

### Rollback

If something goes wrong:
1. Go to **Events** tab
2. Find the last working deploy
3. Click **"Rollback to this deploy"**

---

## 📞 Support & Resources

### Official Resources
- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **Render Community:** https://community.render.com

### PanicSense Resources
- **GitHub Issues:** Report bugs on GitHub
- **Documentation:** See README.md
- **Email Support:** admin@panicsense.ph

### Common Commands

```bash
# View logs locally (if running Render CLI)
render logs

# Connect to database
render db connect panicsense-db

# Shell access (Render Shell)
render shell
```

---

## ✨ Success Checklist

Before going live, verify:

- [ ] App builds successfully
- [ ] Database connected and schema created
- [ ] Environment variables set correctly
- [ ] Admin login works
- [ ] News feed loads data
- [ ] Sentiment analysis functioning
- [ ] Map displays correctly
- [ ] No console errors
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring set up
- [ ] Backups configured

---

## 🎉 You're Live!

Congratulations! Your PanicSense app is now live on Render!

**Next Steps:**
1. Share your URL with users
2. Monitor performance and logs
3. Set up alerts for downtime
4. Plan for scaling as you grow
5. Keep dependencies updated

**Your app is now helping save lives through disaster sentiment analysis! 🚨🇵🇭**

---

*Last updated: October 2025*
*PanicSense - AI-Powered Disaster Response Platform*
