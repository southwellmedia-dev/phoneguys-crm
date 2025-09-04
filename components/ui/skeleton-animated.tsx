'use client';

import { motion } from 'framer-motion';
import { Skeleton } from './skeleton';

interface AnimatedSkeletonProps {
  className?: string;
  delay?: number;
}

export function AnimatedSkeleton({ className, delay = 0 }: AnimatedSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3,
        delay,
        ease: [0.4, 0, 0.2, 1] // Cubic bezier for smooth easing
      }}
    >
      <Skeleton className={className} />
    </motion.div>
  );
}

interface StaggeredSkeletonProps {
  count: number;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredSkeleton({ 
  count, 
  className,
  staggerDelay = 0.05 
}: StaggeredSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <AnimatedSkeleton 
          key={i} 
          className={className} 
          delay={i * staggerDelay} 
        />
      ))}
    </>
  );
}

// Table skeleton with staggered rows
export function StaggeredTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 0.3,
            delay: i * 0.05,
            ease: [0.4, 0, 0.2, 1]
          }}
          className="flex gap-4 p-4 border rounded-lg"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </motion.div>
      ))}
    </div>
  );
}

// Card grid skeleton with staggered cards
export function StaggeredCardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cards }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.3,
            delay: i * 0.05,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <div className="p-6 border rounded-lg space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}