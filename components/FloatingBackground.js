'use client';

// Gentle floating shapes — light, airy, non-threatening
export default function FloatingBackground() {
  const shapes = [
    { size: 320, top: '-80px', left: '-60px', opacity: 0.07, animation: 'floatA 18s ease-in-out infinite', color: '#2a314d', delay: '0s' },
    { size: 220, top: '15%',   right: '-40px', opacity: 0.05, animation: 'floatB 22s ease-in-out infinite', color: '#e3051c', delay: '-6s' },
    { size: 180, bottom: '20%', left: '5%', opacity: 0.06, animation: 'floatC 16s ease-in-out infinite', color: '#f39200', delay: '-3s' },
    { size: 140, top: '45%', right: '8%', opacity: 0.05, animation: 'floatA 20s ease-in-out infinite', color: '#2a314d', delay: '-9s' },
    { size: 100, bottom: '8%', right: '20%', opacity: 0.04, animation: 'floatB 14s ease-in-out infinite', color: '#059669', delay: '-4s' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden',
    }}>
      {/* Subtle dot grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(42,49,77,0.12) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {shapes.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: `${s.size}px`,
            height: `${s.size}px`,
            top: s.top,
            left: s.left,
            right: s.right,
            bottom: s.bottom,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${s.color} 0%, transparent 70%)`,
            opacity: s.opacity,
            animation: s.animation,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}
