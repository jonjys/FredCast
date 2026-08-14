import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center bg-bg">
      <h1 className="text-2xl font-semibold">fred-cast</h1>
      <p className="max-w-sm text-sm text-zinc-400">
        Live-dashboards for FRED-platform. Sign in to view your organization&apos;s dashboard.
      </p>

      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded-xl bg-data px-6 py-3 text-sm font-medium text-zinc-950 hover:opacity-90">
            Logga in
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <div className="flex flex-col items-center gap-4">
          <UserButton afterSignOutUrl="/" />
          <Link
            href="/dashboard"
            className="rounded-xl bg-data px-6 py-3 text-sm font-medium text-zinc-950 hover:opacity-90"
          >
            Gå till dashboard
          </Link>
        </div>
      </SignedIn>
    </main>
  );
}
