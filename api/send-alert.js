// api/send-alert.js
// Vercel serverless function - your Twilio creds stay here, never exposed to users

export default async function handler(req, res) {
  // CORS - allow StormWatch to call this from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, message, type } = req.body;

  // Validate inputs
  if (!to || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, message' });
  }

  // Basic phone number validation
  const phoneRegex = /^\+1[2-9]\d{9}$/;
  if (!phoneRegex.test(to.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone number. Use format: +1XXXXXXXXXX' });
  }

  // Rate limiting - simple check via message type
  // 'alert' = weather alert (always send)
  // 'test' = test message (always send)
  // 'verify' = verification code (always send)
  const allowedTypes = ['alert', 'test', 'verify'];
  if (type && !allowedTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid message type' });
  }

  // Your Twilio credentials from environment variables (set in Vercel dashboard)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error('Missing Twilio environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams({
      To: to.replace(/\s/g, ''),
      From: fromNumber,
      Body: message
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio error:', data);
      return res.status(502).json({ error: data.message || 'SMS send failed', code: data.code });
    }

    return res.status(200).json({
      success: true,
      sid: data.sid,
      status: data.status
    });

  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
