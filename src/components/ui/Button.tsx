interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Button({ children, onClick, type = 'button', variant = 'primary', fullWidth, loading, disabled, className = '' }: ButtonProps) {
  const base = 'flex items-center justify-center gap-2 font-bold rounded-xl transition-all disabled:opacity-50'
  const variants = {
    primary: 'bg-yellow-400 text-black hover:bg-yellow-300',
    secondary: 'bg-gray-700 text-white border border-gray-600 hover:bg-gray-600',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} px-4 py-3 ${className}`}
    >
      {loading ? 'Cargando...' : children}
    </button>
  )
}
