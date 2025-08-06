'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ReactNode, useRef } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  perspective?: number;
}

export function TiltCard({ 
  children, 
  className = '', 
  maxTilt = 15,
  scale = 1.02,
  perspective = 1000
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = (event.clientX - centerX) / (rect.width / 2);
    const mouseY = (event.clientY - centerY) / (rect.height / 2);

    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`transform-gpu ${className}`}
      style={{
        perspective,
        rotateX,
        rotateY,
      }}
      whileHover={{ scale }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}