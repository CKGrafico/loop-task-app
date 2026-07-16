'use client'

import { motion, useReducedMotion } from 'motion/react'

interface RevealProps {
  children: React.ReactNode
  /** Stagger delay in seconds */
  delay?: number
  className?: string
}

/**
 * Scroll reveal: content rises and sharpens as it enters the viewport.
 * Collapses to static under prefers-reduced-motion.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  )
}
