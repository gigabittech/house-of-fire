export default function OfflinePage() {
  return (
    <div
      style={{
        height: '100dvh',
        backgroundColor: '#0A0A08',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          backgroundColor: '#141410',
          border: '1px solid rgba(232, 101, 26, 0.3)',
          borderRadius: '16px',
          padding: '48px 32px',
          maxWidth: '360px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <span
          style={{
            fontSize: '48px',
            lineHeight: 1,
          }}
          role="img"
          aria-label="flame"
        >
          🔥
        </span>
        <h1
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: '28px',
            fontWeight: 600,
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.5px',
          }}
        >
          You&rsquo;re offline
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '15px',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Connect to the internet to load House of Fire.
        </p>
        <a
          href="/"
          style={{
            marginTop: '8px',
            display: 'inline-block',
            backgroundColor: '#E8651A',
            color: '#FFFFFF',
            fontFamily: "'Inter', sans-serif",
            fontSize: '15px',
            fontWeight: 600,
            padding: '12px 28px',
            borderRadius: '50px',
            textDecoration: 'none',
            letterSpacing: '0.2px',
          }}
        >
          Try again
        </a>
      </div>
    </div>
  );
}
