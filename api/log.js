// Serverless endpoint for receiving logs, storing in global buffer, and forwarding to Discord
// Node.js Serverless Function (Vercel)

let inMemoryLogs = global._inMemoryLogs || [];
global._inMemoryLogs = inMemoryLogs;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Return logs (query param or auth optional)
    const authHeader = req.headers.authorization || req.headers['x-api-key'] || req.query.key;
    const expectedKey = process.env.DASHBOARD_KEY || 'osint1337';

    if (authHeader !== expectedKey && req.query.key !== expectedKey) {
      return res.status(401).json({ error: 'Unauthorized. Invalid API Key.' });
    }

    return res.status(200).json({
      status: 'success',
      count: inMemoryLogs.length,
      logs: inMemoryLogs.slice(-100).reverse()
    });
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = { content: body };
        }
      }

      const content = body.content || body.message || '';
      const player = body.player || body.username || 'Unknown';
      const type = body.type || (content.includes('HOME TRACKER') ? 'coordinate' : 'chat');
      const timestamp = new Date().toISOString();

      if (!content && !body.embeds) {
        return res.status(400).json({ error: 'Content is required.' });
      }

      const logEntry = {
        id: Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        player,
        type,
        content,
        timestamp,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
      };

      // Store in memory (capped at 500 entries)
      inMemoryLogs.push(logEntry);
      if (inMemoryLogs.length > 500) {
        inMemoryLogs.shift();
      }

      // Forward to Discord Webhook if configured
      const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
      let discordForwarded = false;

      if (discordWebhook && discordWebhook.startsWith('http')) {
        try {
          const discordPayload = {
            username: 'OSINT Stream Logger',
            avatar_url: 'https://cdn-icons-png.flaticon.com/512/3208/3208726.png',
            content: content || `[${player}] (${type}): Log captured`
          };

          const discordRes = await fetch(discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload)
          });

          discordForwarded = discordRes.ok;
        } catch (err) {
          console.error('Discord forward error:', err);
        }
      }

      return res.status(200).json({
        status: 'ok',
        saved: true,
        discordForwarded,
        log: logEntry
      });
    } catch (err) {
      console.error('Processing log error:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
