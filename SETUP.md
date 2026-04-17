# LeadHunter Pro — Setup Guide

## Step 1: Supabase (Database)

1. Go to https://supabase.com → create free project
2. Open the SQL editor
3. Paste and run the contents of `supabase_schema.sql`
4. Copy your **Project URL** and **service_role key** from Settings > API

## Step 2: Gemini API Key (Free AI)

1. Go to https://aistudio.google.com
2. Click "Get API Key" → Create API key
3. Copy the key

## Step 3: Backend (Railway)

1. Go to https://railway.app → login with GitHub
2. "New Project" → "Deploy from GitHub repo" → select `leadhunter/backend`
3. Add environment variables:
   - `SUPABASE_URL` = your supabase URL
   - `SUPABASE_SERVICE_KEY` = your supabase service role key
   - `GEMINI_API_KEY` = your gemini key
4. Deploy → copy the generated URL (e.g. `https://leadhunter-api.railway.app`)

## Step 4: Dashboard (Vercel)

1. Go to https://vercel.com → login with GitHub
2. "New Project" → import `leadhunter/dashboard`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Railway backend URL
4. Deploy → copy your Vercel URL

## Step 5: Chrome Extension

1. Open `extension/src/utils/api.js`
2. Replace `API_BASE` with your Railway URL
3. Open Chrome → go to `chrome://extensions`
4. Enable "Developer mode" (top right toggle)
5. Click "Load unpacked" → select the `extension/` folder
6. Pin the LeadHunter Pro extension

## Step 6: Using the Extension

1. Go to https://google.com/maps
2. Search for any business type (e.g. "restaurants in Dubai")
3. Click on any business listing
4. Click the LeadHunter Pro extension icon
5. Click "Extract This Business"
6. Review the analysis → click "Save to Dashboard"
7. Open your Vercel URL to see leads + generate outreach

---

## Local Development

```bash
# Backend
cd backend
cp .env.example .env   # fill in your keys
npm install
npm run dev            # runs on http://localhost:3001

# Dashboard
cd dashboard
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev            # runs on http://localhost:3000

# Extension
# Load from chrome://extensions (unpacked) pointing to extension/ folder
```
