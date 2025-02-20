import axios from 'axios';
import { Transform } from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { q } = req.query;
  if (!q) {
    res.status(400).json({ error: 'Missing query parameter: q' });
    return;
  }

  try {
    const searxInstance = 'https://searx.be';
    const searchUrl = `${searxInstance}/search`;
    
    const params = {
      q: Array.isArray(q) ? q[0] : q,
      format: 'html',
      language: 'en-US',
      categories: 'general',
      theme: 'simple'
    };

    const response = await axios.get(searchUrl, {
      params,
      responseType: 'stream',
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const transformStream = new Transform({
      transform(chunk, encoding, callback) {
        let chunkStr = chunk.toString('utf8');
        chunkStr = chunkStr.replace(/href=["']([^"']+)["']/gi, (match, url) => {
          try {
            const validUrl = new URL(url, searxInstance);
            return `href="/api/proxy.js?q=${encodeURIComponent(validUrl.toString())}"`;
          } catch {
            return match;
          }
        });

        chunkStr = chunkStr.replace(/src=["']([^"']+)["']/gi, (match, url) => {
          try {
            const validUrl = new URL(url, searxInstance);
            return `src="/api/proxy.js?q=${encodeURIComponent(validUrl.toString())}"`;
          } catch {
            return match;
          }
        });
        chunkStr = chunkStr.replace(/(https?:\/\/[^\s<>"']+)/gi, (url) => {
          try {
            const validUrl = new URL(url);
            return `/api/proxy.js?q=${encodeURIComponent(validUrl.toString())}`;
          } catch {
            return url;
          }
        });

        callback(null, chunkStr);
      },
      flush(callback) {
        this.push('</body></html>');
        callback();
      }
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.data.pipe(transformStream).pipe(res);
    transformStream.on('error', (err) => {
      console.error('Transform stream error:', err);
      res.end();
    });

    response.data.on('error', (err) => {
      console.error('SearX response stream error:', err);
      res.end();
    });

  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).send(`<!DOCTYPE html>
<html>
<head>
  <title>U BROKE IT</title>
  <style>
    body { font-family: Arial, sans-serif; color: red; padding: 20px; }
  </style>
</head>
<body>
  <h1>U Broke it again</h1>
  <p>Heres da error code ${error.message}</p>
  <p>Bastard</p>
</body>
</html>
`);
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};
