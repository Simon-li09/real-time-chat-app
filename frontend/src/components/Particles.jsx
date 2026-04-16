import { useEffect, useState } from 'react';

const Particles = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      left: Math.random() * 100,
      delay: Math.random() * 20,
      duration: Math.random() * 40 + 20,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 30%, rgba(100,200,255,0.08) 0%, transparent 50%)' }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bg-white rounded-full opacity-40 animate-float pointer-events-none"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}vw`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Particles;
