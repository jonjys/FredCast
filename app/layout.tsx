import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'fred-cast',
  description: 'Live-dashboards for FRED-platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="sv">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          />
        </head>
        <body className="min-h-[390px] min-h-screen bg-bg font-sans text-zinc-50 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}