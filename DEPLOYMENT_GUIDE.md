# Job Portal Deployment Guide

## Quick Deploy on Railway.app (Easiest)

### Step 1: Prepare Your Repository
```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose `Just_IN_with_skills_Parsing`
6. Railway will auto-detect:
   - **Frontend Service**: React/Vite (port 5173)
   - **Backend Service**: Node.js (port 8000)

### Step 3: Configure Environment Variables
In Railway Dashboard → Your Project → Variables:

**Backend Variables:**
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENROUTER_API_KEY=your_openrouter_key
```

**Frontend Variables (if needed):**
```
VITE_API_URL=https://your-backend-domain.railway.app
```

### Step 4: Get Your Domain
After deployment completes:
- **Frontend URL**: `https://jobportal-yt-production.up.railway.app`
- **Backend URL**: `https://jobportal-yt-production.up.railway.app/api`

### Step 5: Update Email Template
Update `.env` with your production domain:
```
FRONTEND_URL=https://your-frontend-domain.railway.app
```

---

## What You Get with Railway

✅ **Free SSL certificate** (HTTPS)
✅ **Auto-deployed from GitHub** (push to main = auto-deploy)
✅ **Custom domain option** (pay extra if you want custom domain)
✅ **Database support** (MongoDB Atlas)
✅ **Environment variables management**
✅ **Logs and monitoring**

---

## Costs

- **First month**: ~$5 credit free
- **Ongoing**: Pay-as-you-go (~$5-15/month depending on usage)
- Cheaper than Heroku, more reliable than free tiers

---

## Using Custom Domain (Optional)

1. Buy domain from:
   - Namecheap
   - GoDaddy
   - Google Domains
   
2. In Railway Dashboard:
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS records at your registrar

3. Update email template:
   ```
   FRONTEND_URL=https://yourdomain.com
   ```

---

## Next Steps

1. Push this guide commit to GitHub
2. Create Railway account
3. Deploy project
4. Test emails with production domain
5. (Optional) Add custom domain

