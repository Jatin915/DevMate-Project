/**
 * loadTemplate.js
 *
 * Maps a language/project-type string to a multi-file starter template.
 * Used by CodeEditor to initialise the workspace when no saved draft exists.
 *
 * Usage:
 *   import { loadTemplate } from '../templates/loadTemplate'
 *   const files = loadTemplate('React')   // → { 'src/App.jsx': '...', ... }
 */

import { htmlTemplate }    from './htmlTemplate'
import { cssTemplate }     from './cssTemplate'
import { jsTemplate }      from './jsTemplate'
import { reactTemplate }   from './reactTemplate'
import { nodeTemplate }    from './nodeTemplate'
import { expressTemplate } from './expressTemplate'
import { pythonTemplate }  from './pythonTemplate'
import { mongoTemplate }   from './mongoTemplate'

const FALLBACK_CODE = '// Write your solution here\n'

/**
 * Returns a files object for the given language/type.
 * If starterCode is provided it is injected into the primary file of the
 * template (overriding the template default) so task-specific starter code
 * is preserved.
 *
 * @param {string} language  - e.g. 'HTML', 'React', 'Node', 'Python'
 * @param {string} [starterCode] - optional task starter code
 * @returns {Record<string, string>} files object
 */
export function loadTemplate(language, starterCode) {
  const lang = (language || '').trim()

  // Normalise common aliases
  const key = lang
    .toLowerCase()
    .replace(/\./g, '')   // Node.js → nodejs
    .replace(/\s+/g, '')  // Express.js → expressjs

  let template

  switch (key) {
    case 'html':
      template = { ...htmlTemplate }
      if (starterCode && starterCode.trim() && starterCode.trim() !== FALLBACK_CODE.trim()) {
        template['index.html'] = starterCode
      }
      return template

    case 'css':
      template = { ...cssTemplate }
      if (starterCode && starterCode.trim() && starterCode.trim() !== FALLBACK_CODE.trim()) {
        template['style.css'] = starterCode
      }
      return template

    case 'javascript':
    case 'js':
      template = { ...jsTemplate }
      if (starterCode && starterCode.trim() && starterCode.trim() !== FALLBACK_CODE.trim()) {
        template['app.js'] = starterCode
      }
      return template

    case 'react':
      template = { ...reactTemplate }
      if (starterCode && starterCode.trim() && starterCode.trim() !== FALLBACK_CODE.trim()) {
        template['src/App.jsx'] = starterCode
      }
      return template

    case 'nodejs':
    case 'node':
      template = { ...nodeTemplate }
      if (starterCode && starterCode.trim() && starterCode.trim() !== FALLBACK_CODE.trim()) {
        template['server.js'] = starterCode
      }
      return template

    case 'expressjs':
    case 'express':
      template = { ...expressTemplate }
      if (starterCode && starterCode.trim() && starterCode.trim() !== FALLBACK_CODE.trim()) {
        template['server.js'] = starterCode
      }
      return template

    case 'python':
    case 'py':
      template = { ...pythonTemplate }
      if (starterCode && starterCode.trim() && starterCode.trim() !== FALLBACK_CODE.trim()) {
        template['solution.py'] = starterCode
      }
      return template

    case 'mongodb':
    case 'mongo':
      template = { ...mongoTemplate }
      if (starterCode && starterCode.trim() && starterCode.trim() !== FALLBACK_CODE.trim()) {
        template['index.js'] = starterCode
      }
      return template

    case 'java':
      return { 'Solution.java': starterCode || 'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello Java");\n    }\n}\n' }

    case 'typescript':
    case 'ts':
      return { 'solution.ts': starterCode || '// TypeScript solution\n\nfunction main(): void {\n  console.log("Hello TypeScript");\n}\n\nmain();\n' }

    default:
      // Unknown language — single file with starter code or fallback
      return { 'solution.js': starterCode || FALLBACK_CODE }
  }
}
