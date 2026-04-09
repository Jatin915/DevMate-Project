export const nodeTemplate = {
  'package.json': `{
  "name": "node-app",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
`,

  'server.js': `const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Hello from Node.js', path: req.url }));
});

server.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`,

  'routes.js': `/**
 * routes.js — define your route handlers here
 */

function handleRequest(req, res) {
  const url = req.url;

  if (url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Welcome to the API' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

module.exports = { handleRequest };
`,

  'README.md': `# Node.js Project

## Run
\`\`\`
node server.js
\`\`\`

## Endpoints
- \`GET /\` — returns a welcome message
`,
}
