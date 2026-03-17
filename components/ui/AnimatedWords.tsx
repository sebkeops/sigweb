'use client'

import { useState, useEffect } from 'react'

interface Props {
  words: string[]
  className?: string
}

export default function AnimatedWords({ words, className = '' }: Props) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length)
        setVisible(true)
      }, 350)
    }, 2800)
    return () => clearInterval(timer)
  }, [words.length])

  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      className={`inline-block transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      {words[index]}
    </span>
  )
}
