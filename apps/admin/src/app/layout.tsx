import '@hof/design-tokens/tokens.css';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Clash Display via Fontshare */}
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
      />
      {/* Inter + JetBrains Mono via Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>House of Fire — Admin</title>
      <body
        style={{
          background: 'var(--hof-bg)',
          color: 'var(--hof-text)',
          fontFamily: 'Inter, system-ui',
        }}
      >
        {children}
      </body>
    </html>
  );
}
