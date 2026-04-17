# StormWatch Alert Backend

One serverless function. Your Twilio credentials stay here — users only enter their phone number.

---

## Deploy to Vercel (15 minutes)

### Step 1 — Push to GitHub

1. Go to github.com → **New repository** → name it `stormwatch-alerts` → Create
2. Upload these files: `api/send-alert.js`, `vercel.json`, `package.json`
   - Click **Add file** → **Upload files** → drag all three in → **Commit changes**

### Step 2 — Connect to Vercel

1. Go to vercel.com → **Add New Project**
2. Import your `stormwatch-alerts` repo from GitHub
3. Leave all settings default → **Deploy**
4. Wait ~30 seconds → you'll get a URL like `https://stormwatch-alerts.vercel.app`

### Step 3 — Add Environment Variables

In Vercel dashboard → your project → **Settings** → **Environment Variables**

Add these three:

| Name | Value |
|------|-------|
| `TWILIO_ACCOUNT_SID` | Your Account SID (starts with AC) |
| `TWILIO_AUTH_TOKEN` | Your Auth Token |
| `TWILIO_FROM_NUMBER` | Your Twilio number e.g. `+15555550100` |

Click **Save** then go to **Deployments** → **Redeploy** so the env vars take effect.

### Step 4 — Update StormWatch

Open `stormwatch.html`, find this line near the top of the script:

```js
var ALERT_API = 'YOUR_VERCEL_URL_HERE';
```

Replace `YOUR_VERCEL_URL_HERE` with your actual Vercel URL:

```js
var ALERT_API = 'https://stormwatch-alerts.vercel.app';
```

Save and open StormWatch. Users can now enter just their phone number to get alerts.

---

## Test It

Once deployed, test from your terminal:

```bash
curl -X POST https://your-project.vercel.app/api/send-alert \
  -H "Content-Type: application/json" \
  -d '{"to":"+19185550100","message":"STORMWATCH TEST: Working!","type":"test"}'
```

Should return: `{"success":true,"sid":"SM...","status":"queued"}`

---

## Cost

- Vercel: **Free** (serverless functions have generous free tier)
- Twilio: **~$0.008 per SMS** — 1,000 alerts = $8
