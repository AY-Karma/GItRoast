import React from 'react'

type CardProps = React.PropsWithChildren<{ className?: string }>

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white dark:bg-gray-800 shadow-sm ${className}`}>
      {children}
    </section>
  )
}

export default Card
