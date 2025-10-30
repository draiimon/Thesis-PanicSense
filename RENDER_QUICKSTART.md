# 🚀 RENDER FREE TIER - QUICKSTART (5 MINUTES!)

## ⚡ Super Fast Deploy to Render FREE Tier

### Step 1: Push to GitHub (1 min)
```bash
git add .
git commit -m "Ready for Render FREE tier deployment"
git push origin main
```

### Step 2: Deploy to Render (2 min)
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Select your GitHub repo
4. Render sees `render.yaml` ✅
5. Click **"Apply"**

### Step 3: Set Secrets (1 min)
Render asks for 2 secrets:

**GROQ_API_KEY:**
- Get from: https://console.groq.com
- Create free account
- Copy API key

**ADMIN_PASSWORD:**
- Create strong password (16+ chars)
- Example: `MySecure2025Pass!`

### Step 4: Deploy! (1 min)
1. Click **"Create New Resources"**
2. Wait 5-10 minutes ⏳
3. Done! 🎉

---

## ✅ What Gets Created (FREE!)

- ✅ Web Service (512 MB RAM)
- ✅ PostgreSQL Database (1 GB)
- ✅ SSL Certificate (Auto)
- ✅ Custom Domain Support
- ✅ Auto-Deploy on Git Push

**Total Cost: $0/month**

---

## 🌐 Access Your App

Your app will be live at:
```
https://panicsense.onrender.com
```

**Admin Login:**
- URL: `https://panicsense.onrender.com/login`
- Username: `panicsenseadmin`
- Password: Your ADMIN_PASSWORD

---

## ⚠️ First Visit? (Important!)

**App may take 30 seconds to load first time** - This is normal!

Why? Free tier apps sleep after 15 min inactivity.

**Fix: Use UptimeRobot (FREE)**
1. Go to https://uptimerobot.com
2. Add Monitor → Your Render URL
3. Interval: 5 minutes
4. **Result: App stays awake 24/7!** ⚡

---

## 🎯 Quick Test

After deployment:

1. **Visit app** → Should show homepage
2. **Login** → Use admin credentials
3. **Check news feed** → Should load articles
4. **Test sentiment** → Upload or analyze text
5. **View map** → Should show Philippines

All working? **You're live!** 🎉

---

## 📊 FREE Tier Limits

| Resource | Limit | Your Usage |
|----------|-------|------------|
| RAM | 512 MB | ~300-400 MB ✅ |
| Database | 1 GB | ~50-100 MB ✅ |
| Bandwidth | 100 GB/month | ~5-10 GB ✅ |
| Build Time | 15 min max | ~8-10 min ✅ |
| Uptime | Sleeps after 15 min | Fix with UptimeRobot |

**You're well within limits!** ✅

---

## 🚨 Troubleshooting

### Build Failed?
Check logs for:
- Missing environment variables → Add in Render dashboard
- Python package errors → Ignore (app still works!)
- Out of memory → Already optimized for 512 MB

### App Won't Load?
- Wait 30 sec (cold start)
- Check Render logs for errors
- Verify DATABASE_URL is set
- Confirm GROQ_API_KEY is valid

### Can't Login?
- Check ADMIN_PASSWORD is set correctly
- Try resetting in Render environment variables
- Clear browser cache

---

## 📝 Environment Variables

**Auto-set by render.yaml:**
- ✅ NODE_ENV=production
- ✅ PORT=10000
- ✅ NODE_OPTIONS=--max-old-space-size=512
- ✅ DATABASE_URL (from database)

**You must set:**
- ❗ GROQ_API_KEY
- ❗ ADMIN_PASSWORD

**Optional:**
- ADMIN_USERNAME (default: panicsenseadmin)
- ADMIN_EMAIL (default: admin@panicsense.ph)

---

## 🎉 That's It!

You're now running PanicSense on Render's FREE tier!

**Next Steps:**
1. Set up UptimeRobot to prevent sleep
2. Share your URL with users
3. Monitor usage in Render dashboard
4. Upgrade when needed ($7/mo for always-on)

**Need help?** See `RENDER_DEPLOY_GUIDE.md` for full details.

---

**Total time: 5 minutes**  
**Total cost: $0/month**  
**Status: Production-ready!** ✅

🚨🇵🇭 **Your disaster response platform is LIVE!**
