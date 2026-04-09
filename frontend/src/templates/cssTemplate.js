export const cssTemplate = {
  'style.css': `/* ── Variables ── */
:root {
  --color-primary: #6366f1;
  --color-bg:      #f9fafb;
  --color-text:    #111827;
  --radius:        8px;
  --shadow:        0 2px 8px rgba(0, 0, 0, 0.08);
}

/* ── Reset ── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ── Base ── */
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  padding: 2rem;
}

/* ── Card component ── */
.card {
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* ── Button ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius);
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:hover { opacity: 0.85; }
`,

  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CSS Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="card">
    <h2>Card Component</h2>
    <p>Hover over me to see the effect.</p>
    <button class="btn">Click me</button>
  </div>
</body>
</html>
`,
}
