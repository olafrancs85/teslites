const assert = require('assert');

(async () => {
  const mod = await import('../app/api/teslite-ai/live/tesla-news/route.ts');
  const { extractImageFromHtml } = mod;

  const html = `
    <html>
      <head>
        <meta property="og:image" content="https://cdn.example.com/featured.jpg" />
        <meta name="twitter:image" content="https://cdn.example.com/twitter.jpg" />
      </head>
      <body>
        <img src="https://cdn.example.com/body.jpg" alt="body" />
      </body>
    </html>
  `;

  assert.strictEqual(
    extractImageFromHtml(html),
    'https://cdn.example.com/featured.jpg',
    'Should prefer OG image metadata when available.'
  );

  console.log('news image extraction test passed');
})();
