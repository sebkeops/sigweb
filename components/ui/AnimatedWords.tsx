'use client'

import { useState, useEffect } from 'react'

interface Props {
  words: string[]
  className?: string
}

export default function AnimatedWords({ words, className = '' }: Props) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'in' | 'out'>('in')

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase('out')
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length)
        setPhase('in')
      }, 300)
    }, 2000)
    return () => clearInterval(timer)
  }, [words.length])

  return (
    <span className="inline-block min-h-[2.4em] overflow-hidden align-bottom sm:min-h-0">
      <span
        aria-live="polite"
        aria-atomic="true"
        className={`inline-block ${phase === 'in' ? 'animate-word-in' : 'animate-word-out'} ${className}`}
      >
        {words[index]}
      </span>
    </span>
  )
}
