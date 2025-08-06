'use client';

import { motion } from 'framer-motion';
import { ChefHat } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    >
      <ChefHat className="h-full w-full" />
    </motion.div>
  );
}

interface PulsingDotsProps {
  className?: string;
}

export function PulsingDots({ className = '' }: PulsingDotsProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 bg-primary rounded-full"
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export function CookingAnimation({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="text-4xl"
        animate={{ 
          rotate: [0, -10, 10, -10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'loop',
        }}
      >
        👨‍🍳
      </motion.div>
      
      {/* Cooking particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-sm"
          style={{
            left: '50%',
            top: '50%',
          }}
          initial={{
            opacity: 0,
            x: 0,
            y: 0,
          }}
          animate={{
            opacity: [0, 1, 0],
            x: [0, (Math.random() - 0.5) * 60],
            y: [0, -30 - Math.random() * 20],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          ✨
        </motion.div>
      ))}
    </motion.div>
  );
}