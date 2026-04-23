import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary'
  className?: string
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', className = '', children, ...rest }, ref) => {
    const base = 'inline-flex items-center px-4 py-2 rounded-md border text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black'
    const color = variant === 'primary'
      ? 'bg-white text-black border-transparent hover:bg-zinc-200'
      : 'bg-zinc-900 text-zinc-100 border-zinc-700 hover:bg-zinc-800'
    return (
      <button ref={ref} className={`${base} ${color} ${className}`} {...rest}>
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
