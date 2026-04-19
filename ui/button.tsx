import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary'
  className?: string
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', className = '', children, ...rest }, ref) => {
    const base = 'inline-flex items-center px-4 py-2 rounded-md border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2'
    const color = variant === 'primary'
      ? 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700'
      : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
    return (
      <button ref={ref} className={`${base} ${color} ${className}`} {...rest}>
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
