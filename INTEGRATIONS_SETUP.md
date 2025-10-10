# 🔗 Integrations Setup Guide

## Overview

Superfocus Pro supports three powerful integrations to enhance your productivity workflow:
- **Todoist** - Sync your tasks
- **Google Calendar** - Import calendar events
- **Notion** - Connect your knowledge workspace

⚠️ **IMPORTANT**: All integrations are **Pro-only features**. Users must have an active Pro subscription ($9/year) to access them.

## Security

All integration endpoints are protected with server-side Pro status verification:
- Users without Pro subscription are redirected with `error=pro_required`
- API endpoints check `isPremium` metadata from Clerk before allowing access
- Friendly upgrade modal is shown when non-Pro users attempt to connect

---

## 🔧 Environment Variables Required

Add these to your `.env.local` (development) or Vercel environment variables (production):

```bash
# Todoist Integration
TODOIST_CLIENT_ID=your_todoist_client_id
TODOIST_CLIENT_SECRET=your_todoist_client_secret
TODOIST_REDIRECT_URI=https://your-domain.com/api/todoist-auth-callback
TODOIST_SCOPE=data:read_write

# Google Calendar Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/google-calendar-auth-callback

# Notion Integration
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
NOTION_REDIRECT_URI=https://your-domain.com/api/notion-auth-callback
```

---

## 1️⃣ Todoist Integration Setup

### **Step 1: Create Todoist App**

1. Go to [Todoist App Management](https://developer.todoist.com/appconsole.html)
2. Click **"Create a new app"**
3. Fill in the details:
   - **App name**: Superfocus
   - **App service URL**: `https://your-domain.com`
   - **OAuth redirect URL**: `https://your-domain.com/api/todoist-auth-callback`

### **Step 2: Get Credentials**

1. Copy the **Client ID**
2. Copy the **Client Secret**
3. Add them to your environment variables

### **Step 3: Configure Scopes**

The app requests these scopes:
- `data:read_write` - Read and modify tasks

### **Step 4: Test the Integration**

1. Open Superfocus as a Pro user
2. Go to **Account → Integrations**
3. Click **"Connect to Todoist"**
4. Authorize the app
5. Your tasks should now sync!

---

## 2️⃣ Google Calendar Integration Setup

### **Step 1: Create Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it **"Superfocus Integration"**

### **Step 2: Enable Google Calendar API**

1. In the Cloud Console, go to **APIs & Services → Library**
2. Search for **"Google Calendar API"**
3. Click **Enable**

### **Step 3: Configure OAuth Consent Screen**

1. Go to **APIs & Services → OAuth consent screen**
2. Select **"External"** user type
3. Fill in the required information:
   - **App name**: Superfocus
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
5. Add test users (your email for development)

### **Step 4: Create OAuth Credentials**

1. Go to **APIs & Services → Credentials**
2. Click **"Create Credentials" → "OAuth client ID"**
3. Select **"Web application"**
4. Configure:
   - **Name**: Superfocus Web Client
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/google-calendar-auth-callback` (development)
     - `https://your-domain.com/api/google-calendar-auth-callback` (production)

### **Step 5: Get Credentials**

1. Copy the **Client ID**
2. Copy the **Client Secret**
3. Add them to your environment variables

### **Step 6: Test the Integration**

1. Open Superfocus as a Pro user
2. Go to **Account → Integrations**
3. Click **"Connect to Google Calendar"**
4. Authorize the app (select your Google account)
5. Your calendar events should now be available!

### **Important Notes:**

- Calendar events are read-only
- Events from the next 7 days are fetched
- Maximum 50 events per request
- Free tier: 1M requests/day (more than enough)

---

## 3️⃣ Notion Integration Setup

### **Step 1: Create Notion Integration**

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Fill in the details:
   - **Name**: Superfocus
   - **Logo**: (Optional) Upload Superfocus logo
   - **Associated workspace**: Select your workspace
   - **Type**: Public integration

### **Step 2: Configure Capabilities**

Select these capabilities:
- ✅ **Read content**
- ✅ **Read user information**
- ✅ **No user information** (optional, for privacy)

### **Step 3: Configure OAuth Settings**

1. In the integration settings, go to **"Distribution"**
2. Enable **"Public integration"**
3. Set the **Redirect URIs**:
   - `http://localhost:3000/api/notion-auth-callback` (development)
   - `https://your-domain.com/api/notion-auth-callback` (production)

### **Step 4: Get Credentials**

1. Copy the **OAuth client ID**
2. Copy the **OAuth client secret**
3. Add them to your environment variables

### **Step 5: Submit for Approval (Production)**

For production use, you need to submit your integration for Notion's approval:
1. Go to **"Distribution"** tab
2. Fill in the required information
3. Submit for review
4. Wait for approval (usually 1-2 weeks)

### **Step 6: Test the Integration**

1. Open Superfocus as a Pro user
2. Go to **Account → Integrations**
3. Click **"Connect to Notion"**
4. Authorize the app
5. Select the pages you want to access
6. Your Notion pages should now be available!

### **Important Notes:**

- Users must explicitly share pages with your integration
- Only shared pages are accessible
- Search returns up to 50 pages
- Free tier: No limits on the API itself
- Rate limit: 3 requests per second

---

## 🧪 Testing in Development

### **Local Development URLs**

When testing locally, use these redirect URIs:
- Todoist: `http://localhost:3000/api/todoist-auth-callback`
- Google Calendar: `http://localhost:3000/api/google-calendar-auth-callback`
- Notion: `http://localhost:3000/api/notion-auth-callback`

### **Running Locally**

```bash
# Make sure you have all environment variables set
npm run dev
# or
vercel dev
```

### **Testing the Flow**

1. Ensure you're logged in as a Pro user
2. Navigate to Account settings
3. Test each integration:
   - Click "Connect"
   - Authorize the app
   - Verify the status changes to "Connected"
   - Check that data is fetched correctly

---

## 🚀 Production Deployment

### **Step 1: Update OAuth Redirect URIs**

For each integration, add your production URL:
- Todoist: `https://superfocus.com/api/todoist-auth-callback`
- Google Calendar: `https://superfocus.com/api/google-calendar-auth-callback`
- Notion: `https://superfocus.com/api/notion-auth-callback`

### **Step 2: Set Environment Variables in Vercel**

1. Go to your Vercel project
2. Navigate to **Settings → Environment Variables**
3. Add all the integration credentials
4. Set them for **Production** environment

### **Step 3: Deploy**

```bash
git add .
git commit -m "Add Google Calendar and Notion integrations"
git push origin main
```

Vercel will automatically deploy with the new environment variables.

### **Step 4: Verify in Production**

1. Test each integration with a real Pro account
2. Monitor the Vercel logs for any errors
3. Check that OAuth flows work correctly

---

## 🔒 Security Best Practices

### **1. Token Storage**
- Tokens are stored in HTTP-only cookies
- Cookies are Secure and SameSite=Strict
- Tokens are never exposed to JavaScript

### **2. Environment Variables**
- Never commit `.env.local` to git
- Use Vercel's environment variable management
- Rotate secrets periodically

### **3. OAuth Scopes**
- Request minimal scopes needed
- Clearly communicate to users what data you access
- Provide easy disconnect options

### **4. Error Handling**
- Never expose API credentials in errors
- Log errors server-side only
- Show user-friendly error messages

---

## 📊 API Rate Limits

| Integration | Free Tier Limit | Notes |
|------------|----------------|-------|
| **Todoist** | No hard limit | ~450 requests/minute recommended |
| **Google Calendar** | 1M requests/day | ~100 requests/100s per user |
| **Notion** | No hard limit | 3 requests/second |

All limits are **more than sufficient** for Superfocus's use case.

---

## 🐛 Troubleshooting

### **Integration shows "Not connected" after OAuth**

1. Check that redirect URIs match exactly (including http/https)
2. Verify environment variables are set correctly
3. Check Vercel logs for error messages
4. Ensure cookies are not blocked

### **"Invalid credentials" error**

1. Verify Client ID and Client Secret are correct
2. Check that the integration is enabled
3. Ensure you're using the correct environment (test vs production)

### **Data not fetching after connection**

1. Check API endpoint responses in Network tab
2. Verify the user has proper permissions
3. Check rate limits haven't been exceeded
4. Review server logs for errors

---

## 📚 API Documentation

- [Todoist API Docs](https://developer.todoist.com/rest/v2/)
- [Google Calendar API Docs](https://developers.google.com/calendar/api/guides/overview)
- [Notion API Docs](https://developers.notion.com/)

---

## ✅ Integration Checklist

Before going live, ensure:

- [ ] All OAuth apps are configured correctly
- [ ] Production redirect URIs are set
- [ ] Environment variables are in Vercel
- [ ] All three integrations tested in production
- [ ] Error handling works properly
- [ ] User can connect and disconnect smoothly
- [ ] Tokens are stored securely
- [ ] Privacy policy mentions integrations
- [ ] Users understand what data is accessed

---

## 💡 Future Improvements

Consider adding:
- [ ] Refresh token rotation for Google Calendar
- [ ] Webhook support for real-time sync
- [ ] Bulk import/export features
- [ ] Custom field mapping
- [ ] Advanced filtering options
- [ ] Integration usage analytics

