# Netlify Deployment Guide

## 🚨 **IMPORTANT: Environment Variables**

Your Netlify deployment is failing because of incorrect environment variable names.

### ❌ **Current (Incorrect) Variables in Netlify:**
```
REACT_APP_SUPABASE_ANON_KEY
REACT_APP_SUPABASE_URL
```

### ✅ **Required Variables for Next.js:**
```
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NODE_ENV=production
```

## 🔧 **How to Fix in Netlify Dashboard:**

1. **Go to your Netlify site dashboard**
2. **Navigate to: Site Settings → Environment Variables**
3. **Delete the incorrect variables:**
   - Remove `REACT_APP_SUPABASE_ANON_KEY`
   - Remove `REACT_APP_SUPABASE_URL`
4. **Add the correct variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key
   - `ANTHROPIC_API_KEY` = your Claude API key
   - `NODE_ENV` = `production`

## 🔄 **After Updating Variables:**

1. **Trigger a new deploy** (Netlify will automatically rebuild when you push new commits)
2. **Or manually trigger**: Deploys → Trigger deploy → Deploy site

## 📱 **Getting Your Supabase Keys:**

1. Go to [supabase.com](https://supabase.com) → Your project
2. **Settings → API**:
   - **Project URL** = `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** = `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** = `SUPABASE_SERVICE_ROLE_KEY` (Keep this secret!)

## 🔑 **Getting Your Anthropic API Key:**

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. **API Keys** → Create new key
3. Copy the key = `ANTHROPIC_API_KEY`

## 🌐 **Custom Domain Setup:**

After successful deployment:
1. **Domain Settings** → Add custom domain
2. **Enter:** `lilyojuri.com`
3. **Follow DNS instructions** Netlify provides

---

## 🚨 **Quick Fix Summary:**

**The main issue:** `REACT_APP_*` variables don't work with Next.js. You need `NEXT_PUBLIC_*` variables instead.

**Fix this and your deployment will succeed!**