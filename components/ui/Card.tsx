import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
}

export function Card({ title, children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`} {...props}>
      {title && <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>}
      {children}
    </div>
  )
}
