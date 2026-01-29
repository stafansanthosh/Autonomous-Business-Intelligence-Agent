import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Autonomous BI Prototype',
  description: 'Chat-based exploratory BI prototype'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
  <header className="px-4 py-2 bg-red-600 text-white text-sm font-semibold tracking-wide">Autonomous Business Intelligence Agent</header>
        <main className="flex-1 flex overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
