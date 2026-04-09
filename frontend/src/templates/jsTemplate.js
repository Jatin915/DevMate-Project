export const jsTemplate = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JavaScript Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="main.js"></script>
</body>
</html>
`,

  'style.css': `body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f9fafb;
  color: #111827;
  padding: 2rem;
  line-height: 1.6;
}

#app {
  max-width: 600px;
}
`,

  'main.js': `import { createApp } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  createApp(app);
});
`,

  'app.js': `/**
 * app.js — main application logic
 */
export function createApp(container) {
  container.innerHTML = \`
    <h1>JavaScript Project</h1>
    <p id="output">Ready.</p>
    <button id="btn">Run</button>
  \`;

  document.getElementById('btn').addEventListener('click', () => {
    document.getElementById('output').textContent = 'Button clicked at ' + new Date().toLocaleTimeString();
  });
}
`,
}
