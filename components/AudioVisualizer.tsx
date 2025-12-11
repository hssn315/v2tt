import React, { useEffect, useRef } from 'react';

interface Props {
  isActive: boolean;
}

const AudioVisualizer: React.FC<Props> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      time += 0.05;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Base line
      const centerY = height / 2;

      if (!isActive) {
        // Resting State: A subtle breathing line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        
        // Small pulse
        ctx.beginPath();
        const pulse = Math.sin(time * 2) * 2;
        ctx.arc(width / 2, centerY, 2 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.fill();
        
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Active State: Luxury Waves
      
      // Wave 1: Cyan (Snow)
      ctx.beginPath();
      const gradient1 = ctx.createLinearGradient(0, 0, width, 0);
      gradient1.addColorStop(0, 'rgba(6, 182, 212, 0)');
      gradient1.addColorStop(0.5, 'rgba(6, 182, 212, 1)');
      gradient1.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.strokeStyle = gradient1;
      ctx.lineWidth = 3;

      for (let i = 0; i < width; i++) {
        const y = centerY + Math.sin(i * 0.02 + time) * 30 * Math.sin(i * 0.01) * Math.sin(time * 0.5);
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();

      // Wave 2: Pink (Luxury)
      ctx.beginPath();
      const gradient2 = ctx.createLinearGradient(0, 0, width, 0);
      gradient2.addColorStop(0, 'rgba(232, 121, 249, 0)');
      gradient2.addColorStop(0.5, 'rgba(232, 121, 249, 0.8)');
      gradient2.addColorStop(1, 'rgba(232, 121, 249, 0)');
      ctx.strokeStyle = gradient2;
      ctx.lineWidth = 3;

      for (let i = 0; i < width; i++) {
        const y = centerY + Math.sin(i * 0.03 - time * 1.5) * 20 * Math.sin(i * 0.005);
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();

      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(6, 182, 212, 0.5)";

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  return (
    <div className="w-full h-24 relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm shadow-inner">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={100} 
        className="w-full h-full"
      />
    </div>
  );
};

export default AudioVisualizer;