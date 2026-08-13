'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Updates the `from`/`to` query params on the current URL. The dashboard
 * page (a Server Component) reads those params on the next request, so
 * this needs no client-side data fetching of its own.
 */
export function DateRangePicker({ defaultFrom, defaultTo }: { defaultFrom: string; defaultTo: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get('from') ?? defaultFrom;
  const to = searchParams.get('to') ?? defaultTo;

  function update(next: { from?: string; to?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', next.from ?? from);
    params.set('to', next.to ?? to);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2">
      <input
        aria-label="Från"
        type="date"
        value={from}
        onChange={(event) => update({ from: event.target.value })}
        className="bg-transparent text-sm text-zinc-50 outline-none"
      />
      <span className="text-zinc-500">–</span>
      <input
        aria-label="Till"
        type="date"
        value={to}
        onChange={(event) => update({ to: event.target.value })}
        className="bg-transparent text-sm text-zinc-50 outline-none"
      />
    </div>
  );
}
