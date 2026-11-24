const path = require('path');

// Backend root is one level up from utils/
const BACKEND_ROOT = path.join(__dirname, '..');

/**
 * Resolves a stored filePath to an absolute path that is stable
 * regardless of the Node process's current working directory.
 * - Absolute paths → returned as-is
 * - Relative paths → resolved from BACKEND_ROOT (not process.cwd())
 */
module.exports = function resolveFilePath(storedPath) {
  if (!storedPath) return null;
  if (path.isAbsolute(storedPath)) return storedPath;
  // Strip leading ./ or / so path.join works correctly
  const clean = storedPath.replace(/^\.\//, '').replace(/^\//, '');
  return path.join(BACKEND_ROOT, clean);
};
