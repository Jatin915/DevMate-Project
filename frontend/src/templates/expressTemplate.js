export const expressTemplate = {
  'package.json': `{
  "name": "express-app",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
`,

  'server.js': `const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Express server running' });
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server listening on http://localhost:\${PORT}\`);
});
`,

  'routes/users.js': `const express = require('express');
const router = express.Router();

// In-memory store for demo
const users = [];

router.get('/', (req, res) => {
  res.json(users);
});

router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  const user = { id: Date.now(), name, email };
  users.push(user);
  res.status(201).json(user);
});

module.exports = router;
`,

  'middleware/logger.js': `/**
 * Request logger middleware
 */
function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(\`\${req.method} \${req.url} \${res.statusCode} \${ms}ms\`);
  });
  next();
}

module.exports = logger;
`,
}
