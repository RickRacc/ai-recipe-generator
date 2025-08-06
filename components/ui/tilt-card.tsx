'use client';

import { ReactNode, useRef } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TiltCard({ 
  children, 
  className = '',
  disabled = false
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || disabled) return;

    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    ref.current.style.setProperty('--mouse-x', x.toString());
    ref.current.style.setProperty('--mouse-y', y.toString());
  };

  const handleMouseLeave = () => {
    if (!ref.current || disabled) return;
    
    ref.current.style.setProperty('--mouse-x', '0.5');
    ref.current.style.setProperty('--mouse-y', '0.5');
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        '--mouse-x': '0.5',
        '--mouse-y': '0.5',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}