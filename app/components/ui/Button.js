'use client';

export default function Button({ children, className = '', variant = 'primary', size = 'md', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-4.5 py-2.5 text-base',
  };
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-400',
    secondary: 'bg-white/10 hover:bg-white/20 text-blue-100 focus:ring-blue-300',
    danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-400',
    ghost: 'bg-transparent hover:bg-white/10 text-blue-100 focus:ring-blue-300',
  };
  return (
    <button className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}


