/**
 * Global teardown for Playwright tests.
 * Cleans up Docker containers after all tests finish (only in CI).
 */
export default async function globalTeardown() {
  // Only run cleanup in CI environment
  if (!process.env.CI) {
    console.log('Skipping Docker cleanup (not in CI)');
    return;
  }

  console.log('Running global teardown: stopping bookmarks-api containers...');

  try {
    // Use the bookmarks-api docker-compose.yml to bring down services
    const { execSync } = require('child_process');
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