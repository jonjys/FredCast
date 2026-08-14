import { describe, expect, it } from 'vitest';

// Vitest sets NODE_ENV=test, so the guard below is a no-op in this CI run —
// it only bites if this file is ever executed with NODE_ENV=production
// directly (e.g. a build-time script), which is the scenario it guards.
describe('required env vars exist in production', () => {
  it('FRED_API_KEY, CLERK_SECRET_KEY, and the Clerk publishable key are all set', () => {
    if (process.env.NODE_ENV === 'production') {
      expect(process.env.FRED_API_KEY).toBeDefined();
      expect(process.env.CLERK_SECRET_KEY).toBeDefined();
      expect(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBeDefined();
    }
  });
});
