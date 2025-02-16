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

  const apiKey = '61e1c5f58bca02da965a1e5184cca19a9b36699a35b3b74e0970b24bb705e16a';

  try {
    // Consider switching from 'search.json' to 'search' if HTML output is desired.
    const searchUrl = 'https://serpapi.com/search';
    const params = {
      engine: 'duckduckgo',
      q: Array.isArray(q) ? q[0] : q,
      kl: 'us-en',
      api_key: apiKey,
      output: 'html'
    };

    const response = await axios.get(searchUrl, {
      params,
      responseType: 'stream',
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200);
    res.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Search Results for "${q}"</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Search Results for "${q}"</h1>
`);

    const transformStream = new Transform({
      transform(chunk, encoding, callback) {
        let chunkStr = chunk.toString('utf8');
        chunkStr = chunkStr.replace(/href=["']([^"']+)["']/gi, (match, url) => {
          try {
            const validUrl = new URL(url);
            return `href="/api/proxy.js?q=${encodeURIComponent(validUrl.toString())}"`;
          } catch {
            return match;
          }
        });
        chunkStr = chunkStr.replace(/src=["']([^"']+)["']/gi, (match, url) => {
          try {
            const validUrl = new URL(url);
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
        // Append closing HTML tags when the stream finishes.
        this.push(`</body></html>`);
        callback();
      }
    });

    // Pipe the API stream through our transform and then to the response.
    response.data.pipe(transformStream).pipe(res);

    // Optional: handle any errors on the streams.
    transformStream.on('error', (err) => {
      console.error('Transform stream error:', err);
      res.end();
    });
    response.data.on('error', (err) => {
      console.error('API response stream error:', err);
      res.end();
    });
  } catch (error) {
    console.error('Search API error:', error.response?.data || error.message);
    res.status(500).send(`<!DOCTYPE html>
<html>
<head>
  <title>Search Error</title>
  <style>
    body { font-family: Arial, sans-serif; color: red; padding: 20px; }
  </style>
</head>
<body>
  <h1>U Broke it again</h1>
  <p>An error occurred while processing your search: ${error.message}</p>
  <p>bastard</p>
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
