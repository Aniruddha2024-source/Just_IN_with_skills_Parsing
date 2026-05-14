# Job Portal Deployment Guide

## Quick Deploy on Railway.app (Easiest)

### Step 1: Prepare Your Repository
```bash
git add .
git commit -m "Add deployment configuration and monorepo setup"
git push origin main
```

### Step 2: Deploy on Railway (Monorepo Setup)
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose `Just_IN_with_skills_Parsing`
6. Railway will detect the monorepo structure via:
   - `railway.json` - Service configuration
   - `backend/Dockerfile` - Backend service
   - `frontend/Dockerfile` - Frontend service

**Railway will automatically:**
   - ✅ Build backend from `backend/` directory
   - ✅ Build frontend from `frontend/` directory
   - ✅ Deploy both as separate services
   - ✅ Assign unique domains to each service

### Step 5: Connect Backend and Frontend
Update environment variables to connect the services:

**In Backend Service (Railway Dashboard):**
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
FRONTEND_URL=https://your-frontend-domain.up.railway.app
PORT=8000
```

**In Frontend Service (Railway Dashboard):**
```
VITE_API_URL=https://your-backend-domain.up.railway.app
```

### Step 4: Get Your Domains
After deployment completes, Railway assigns unique domains:

**Backend Service:**
- Format: `https://jobportal-yt-backend-production.up.railway.app`
- API endpoint: `https://jobportal-yt-backend-production.up.railway.app/api`
- All endpoints available here

**Frontend Service:**
- Format: `https://jobportal-yt-frontend-production.up.railway.app`
- Your main app URL
- Will redirect API calls to backend domain

### Step 6: Update Email Template
Update `.env` in backend with your production frontend domain:
```
FRONTEND_URL=https://your-frontend-domain.up.railway.app
```

This makes email links work correctly:
- Users click email link
- Opens: `https://your-frontend-domain.up.railway.app/jobs/{jobId}`
- Frontend makes API calls to: `https://your-backend-domain.up.railway.app/api`

---

---

## Project Structure (Monorepo)

```
jobportal-yt/
├── backend/
│   ├── Dockerfile          ← Build instructions
│   ├── Procfile            ← Railway process definition
│   ├── package.json
│   ├── index.js
│   └── ...
├── frontend/
│   ├── Dockerfile          ← Build instructions
│   ├── package.json
│   ├── vite.config.js
│   └── ...
├── railway.json            ← Monorepo configuration
├── DEPLOYMENT_GUIDE.md     ← This file
└── ...
```

**Key Files for Railway:**
- `railway.json` - Main configuration for monorepo
- `backend/Dockerfile` - How to build/run backend
- `frontend/Dockerfile` - How to build/run frontend

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

## Troubleshooting

### Error: "Could not detect a buildable project"
**Solution:** We've already fixed this by adding:
- ✅ `railway.json` - Tells Railway about monorepo structure
- ✅ `backend/Dockerfile` - Docker build instructions
- ✅ `frontend/Dockerfile` - Docker build instructions

### Frontend showing "Cannot reach server"
**Solution:** 
1. Check `VITE_API_URL` in frontend environment variables
2. Should be: `https://your-backend-domain.up.railway.app`
3. Restart frontend service in Railway dashboard

### Email links show "Cannot reach server"
**Solution:**
1. Check `FRONTEND_URL` in backend environment variables
2. Should be: `https://your-frontend-domain.up.railway.app`
3. Restart backend service

### Services not detected
**Solution:**
1. Make sure `railway.json` is in root directory
2. Make sure both Dockerfiles exist:
   - `backend/Dockerfile`
   - `frontend/Dockerfile`
3. Redeploy or create new project

---

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

