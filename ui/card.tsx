import React from 'react'

type CardProps = React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>

export const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => {
  return (
    <section className={`rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-sm ${className}`} {...rest}>
      {children}
    </section>
  )
}

export default Card
