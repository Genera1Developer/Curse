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
    const searchQuery = Array.isArray(q) ? q[0] : q;
    const searchUrl = new URL('/search', searxInstance);
    searchUrl.searchParams.append('q', searchQuery);
    searchUrl.searchParams.append('categories', 'general');
    searchUrl.searchParams.append('language', 'en');
    searchUrl.searchParams.append('format', 'html');
    
    console.log('Requesting:', searchUrl.toString());

    const response = await axios({
      method: 'GET',
      url: searchUrl.toString(),
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500; 
      },
      maxRedirects: 5,
      timeout: 10000
    });
    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      const redirectUrl = new URL(response.headers.location, searxInstance).toString();
      res.redirect(`/api/search.js?q=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    if (response.data) {
      let html = response.data;
      html = html.replace(/href=["'](\/[^"']+)["']/g, 
        (match, path) => `href="/api/search.js?q=${encodeURIComponent(searxInstance + path)}"`);
      html = html.replace(/href=["'](https?:\/\/[^"']+)["']/g,
        (match, url) => `href="/api/search.js?q=${encodeURIComponent(url)}"`);
      html = html.replace(/<form([^>]*)action=["']([^"']+)["']/g,
        (match, attrs, action) => {
          const actionUrl = action.startsWith('http') ? action : searxInstance + action;
          return `<form${attrs}action="/api/search.js?q=${encodeURIComponent(actionUrl)}"`;
        });
      html = html.replace(/<base[^>]*>/g, `<base href="${searxInstance}/">`);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } else {
      throw new Error('No content received from search engine');
    }

  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).send(`<!DOCTYPE html>
<html>
<head>
  <title>Search Error</title>
  <style>
    body { font-family: Arial, sans-serif; color: red; padding: 20px; }
  </style>
</head>
<body>
  <h1>U Broke It!</h1>
  <p>An error occurred while processing your search: ${error.message}</p>
  <p>Bastard.</p>
  <pre>${error.stack}</pre>
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
