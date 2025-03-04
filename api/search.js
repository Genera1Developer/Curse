import axios from 'axios'; //revert to previous version for fixy for now
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
    const searchQuery = Array.isArray(q) ? q[0] : q;
    
    let searchUrl;
    try {
      const urlTest = new URL(searchQuery);
      searchUrl = searchQuery;
    } catch {
      searchUrl = `${searxInstance}/search`;
    }

    const response = await axios({
      method: 'GET',
      url: searchUrl,
      ...(searchUrl === `${searxInstance}/search` ? {
        params: {
          q: searchQuery,
          format: 'html',
          language: 'en-US',
          categories: 'general',
          theme: 'simple'
        }
      } : {}),
      responseType: 'stream',
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      maxRedirects: 5
    });

    const transformStream = new Transform({
      transform(chunk, encoding, callback) {
        let chunkStr = chunk.toString('utf8');
        
        chunkStr = chunkStr.replace(/href=["'](\/[^"']+)["']/gi, (match, url) => {
          return `href="/api/proxy.js?q=${encodeURIComponent(searxInstance + url)}"`;
        });

        chunkStr = chunkStr.replace(/href=["'](https?:\/\/[^"']+)["']/gi, (match, url) => {
          return `href="/api/proxy.js?q=${encodeURIComponent(url)}"`;
        });

        chunkStr = chunkStr.replace(/src=["'](\/[^"']+)["']/gi, (match, url) => {
          return `src="/api/proxy.js?q=${encodeURIComponent(searxInstance + url)}"`;
        });

        chunkStr = chunkStr.replace(/src=["'](https?:\/\/[^"']+)["']/gi, (match, url) => {
          return `src="/api/proxy.js?q=${encodeURIComponent(url)}"`;
        });

        chunkStr = chunkStr.replace(/action=["'](\/[^"']+)["']/gi, (match, url) => {
          return `action="/api/search.js?q=${encodeURIComponent(searxInstance + url)}"`;
        });

        chunkStr = chunkStr.replace(/(\shref=|\ssrc=|\saction=)(https?:\/\/[^\s<>"']+)/gi, (match, attr, url) => {
          return `${attr}"/api/proxy.js?q=${encodeURIComponent(url)}"`;
        });

        callback(null, chunkStr);
      }
    });

    const headers = response.headers;
    for (const [key, value] of Object.entries(headers)) {
      if (!['content-length', 'content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.data.pipe(transformStream).pipe(res);

    transformStream.on('error', (err) => {
      console.error('Stream error:', err);
      res.end();
    });

    response.data.on('error', (err) => {
      console.error('SearX stream error:', err);
      res.end();
    });

  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).send(`
      <html>
        <head><title>U BROKE IT</title></head>
        <body>
          <h1>U Broke It!</h1>
          <p>bastard.  ${error.message}</p>
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
