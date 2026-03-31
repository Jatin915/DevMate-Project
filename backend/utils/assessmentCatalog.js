const Assessment = require('../models/Assessment');

const CATALOG = {
  HTML: {
    taskTitle: 'Build semantic profile card',
    description: 'Create semantic HTML for a developer profile card with name, role, skills list, and a contact button. Use header, section, ul/li, and button.',
    starterCode: '<!-- Add semantic HTML only -->\n<main>\n\n</main>',
    expectedOutput: 'Contains semantic tags, profile details, and valid nested structure.',
  },
  CSS: {
    taskTitle: 'Responsive card styling',
    description: 'Style a card using flexbox with spacing, hover transition, and a mobile breakpoint below 600px.',
    starterCode: '/* Write CSS here */\n.card {\n\n}',
    expectedOutput: 'Card has responsive layout, hover effect, and readable spacing.',
  },
  JavaScript: {
    taskTitle: 'Todo stats utility',
    description: 'Write a function `getTodoStats(items)` returning total, completed, and pending counts from an array of todo objects.',
    starterCode: 'function getTodoStats(items) {\n  // TODO\n}\n',
    expectedOutput: 'Returns an object with total/completed/pending based on input list.',
  },
  React: {
    taskTitle: 'Counter with hooks',
    description: 'Create a React component with count state, increment/decrement buttons, and disable decrement below 0.',
    starterCode: 'import { useState } from "react"\n\nexport default function Counter() {\n  // TODO\n}\n',
    expectedOutput: 'Uses useState, renders count, and handles button events safely.',
  },
  'Node.js': {
    taskTitle: 'Simple API endpoint',
    description: 'Write an Express handler for GET /health that returns `{ ok: true }` with status 200.',
    starterCode: 'app.get("/health", (req, res) => {\n  // TODO\n})\n',
    expectedOutput: 'Returns JSON health response with correct status.',
  },
  'Express.js': {
    taskTitle: 'Auth middleware check',
    description: 'Implement middleware that reads `Authorization` header and returns 401 when missing.',
    starterCode: 'function auth(req, res, next) {\n  // TODO\n}\n',
    expectedOutput: 'Properly validates authorization header and calls next when valid.',
  },
  MongoDB: {
    taskTitle: 'Create user schema',
    description: 'Define a Mongoose schema with fields: name, email(unique), createdAt(default Date.now).',
    starterCode: 'const schema = new mongoose.Schema({\n  // TODO\n})\n',
    expectedOutput: 'Schema includes required fields and unique email.',
  },
};

async function ensureAssessmentsForLanguages(languages) {
  const out = [];
  for (const language of languages) {
    const meta = CATALOG[language];
    if (!meta) continue;
    const doc = await Assessment.findOneAndUpdate(
      { language, taskTitle: meta.taskTitle },
      { $set: { language, ...meta, difficulty: 'intermediate' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    out.push(doc);
  }
  return out;
}

module.exports = { CATALOG, ensureAssessmentsForLanguages };
