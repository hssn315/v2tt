
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
      time += 0.1; // Speed of animation
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      const centerY = height / 2;

      if (!isActive) {
        // Resting State
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Active State: Simulated Voice Waves
      // We simulate 3 layers of waves since we don't have direct audio data access 
      // when using the native Web Speech API (privacy restriction).
      
      const colors = [
        'rgba(6, 182, 212, 0.8)', // Cyan
        'rgba(232, 121, 249, 0.8)', // Pink
        'rgba(255, 255, 255, 0.5)'  // White
      ];

      colors.forEach((color, index) => {
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;

          for (let i = 0; i < width; i++) {
            // Create a randomized wave pattern that looks like voice
            const frequency = 0.01 + (index * 0.005);
            const amplitude = 15 + (Math.sin(time * (index + 1)) * 10);
            const movement = time * (2 + index);
            
            // Compose wave
            const y = centerY + 
                      Math.sin(i * frequency + movement) * 
                      amplitude * 
                      Math.sin(i * 0.01) * // Envelope to taper ends
                      (Math.random() * 0.2 + 0.8); // Jitter

            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
          }
          ctx.stroke();
      });

      // Glow effect
      ctx.shadowBlur = 10;
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
