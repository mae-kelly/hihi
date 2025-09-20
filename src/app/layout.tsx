import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CyberVision 5000 - Quantum Security Visibility Platform',
  description: 'Ultra-futuristic cyber security visibility and threat intelligence dashboard',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-cyber-black text-cyber-cyan antialiased">
        {children}
      </body>
    </html>
  );
}