/**
 * Global teardown for Playwright tests.
 * Cleans up Docker containers after all tests finish (only in CI).
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function globalTeardown() {
  // Only run cleanup in CI environment
  if (!process.env.CI) {
    console.log('Skipping Docker cleanup (not in CI)');
    return;
  }

  console.log('Running global teardown: stopping bookmarks-api containers...');

  try {
    // Use the bookmarks-api docker-compose.yml to bring down services
    execSync('docker compose -f ../../bookmarks-api/docker-compose.yml down -v', {
      cwd: __dirname,
      stdio: 'inherit',
      timeout: 120000,
    });
    console.log('bookmarks-api containers stopped and volumes removed');
  } catch (error) {
    console.error('Failed to stop bookmarks-api containers:', error);
    // Don't throw - we want tests to complete even if cleanup fails
  }
}