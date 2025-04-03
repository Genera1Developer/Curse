import axios from 'axios';
import express from 'express';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PassThrough } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
});
app.use(limiter);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

const isAbsoluteURL = (url) => url.startsWith('http') || url.startsWith('//');

const createProxyUrl = (url, baseUrl) => {
  if (!url) return url;
  if (url.startsWith('/window.js')) return url;

  if (isAbsoluteURL(url)) {
    return `/extra/moreextra/window.js?q=${encodeURIComponent(url)}`;
  }

  if (baseUrl) {
    const base = new URL(baseUrl);
    return `/api/window.js?q=${encodeURIComponent(new URL(url, base).href)}`;
  }

  return url;
};

app.get('/api/window.js', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query parameter: q' });

  try {
    const response = await axios.get(q, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': new URL(q).origin,
        'Accept': 'text/html,application/xhtml+xml,application/xml,application/javascript,text/javascript,text/css,text/plain,image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif,image/apng,font/woff,font/woff2,font/ttf,font/otf,application/json,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      },
      maxRedirects: 5,
      timeout: 15000,
      decompress: true,
      validateStatus: status => status < 400 || status === 404
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const passThrough = new PassThrough();
    response.data.pipe(passThrough);

    let firstChunk = true;
    let firstBuffer = Buffer.alloc(0);

    passThrough.on('data', (chunk) => {
      if (firstChunk) {
        firstBuffer = Buffer.concat([firstBuffer, chunk]);

        if (firstBuffer.length >= 50000) {
          res.write(firstBuffer);
          firstChunk = false;
        }
      } else {
        res.write(chunk);
      }
    });

    passThrough.on('end', () => res.end());
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({
      error: 'Error fetching resource',
      details: error.message,
    });
  }
});

app.use(express.static('public'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
