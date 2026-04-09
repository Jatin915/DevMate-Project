export const htmlTemplate = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DevMate Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <header>
    <h1>My Project</h1>
  </header>

  <main>
    <p>Start building here.</p>
  </main>

  <script src="script.js"></script>
</body>
</html>
`,

  'style.css': `/* ── Reset ── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ── Base ── */
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f9fafb;
  color: #111827;
  line-height: 1.6;
  padding: 2rem;
}

header {
  margin-bottom: 1.5rem;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
}

main {
  max-width: 720px;
}
`,

  'script.js': `// ── Main script ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('Project ready.');
});
`,
}
