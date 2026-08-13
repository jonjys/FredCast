'use client';

export function ExportMenu({ orgId }: { orgId: string }) {
  return (
    <a
      href={`/api/export/pdf?orgId=${orgId}`}
      target="_blank"
      rel="noreferrer"
      className="rounded-xl bg-data px-4 py-2 text-sm font-medium text-zinc-950"
    >
      Exportera PDF
    </a>
  );
}
