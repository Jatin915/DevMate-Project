/**
 * buildFileTree.js
 *
 * Converts a flat files object into a nested tree structure.
 *
 * Input:
 *   {
 *     "index.html": "...",
 *     "src/App.jsx": "...",
 *     "src/hooks/useForm.js": "...",
 *   }
 *
 * Output:
 *   {
 *     "index.html": null,          // null = file leaf
 *     "src": {                     // object = folder
 *       "App.jsx": null,
 *       "hooks": {
 *         "useForm.js": null
 *       }
 *     }
 *   }
 */
export function buildFileTree(files) {
  const tree = {}

  Object.keys(files).forEach((filePath) => {
    const parts = filePath.split('/')
    let node = tree

    parts.forEach((part, idx) => {
      const isFile = idx === parts.length - 1
      if (isFile) {
        // Leaf — store null to mark as file
        if (!(part in node)) node[part] = null
      } else {
        // Intermediate folder
        if (!node[part] || node[part] === null) node[part] = {}
        node = node[part]
      }
    })
  })

  return tree
}

/**
 * Returns all file paths that live inside a given folder prefix.
 * Used to check whether a folder contains the active file.
 */
export function folderContainsActive(folderPrefix, activeFile) {
  return activeFile?.startsWith(folderPrefix + '/')
}
