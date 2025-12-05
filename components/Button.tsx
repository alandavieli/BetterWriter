import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading,
  className = '',
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gold-500 hover:bg-gold-600 text-white shadow-md shadow-gold-500/20 active:scale-95",
    secondary: "bg-cream-200 dark:bg-neutral-800 text-gray-800 dark:text-cream-100 hover:bg-cream-300 dark:hover:bg-neutral-700",
    ghost: "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300",
    danger: "bg-red-500 hover:bg-red-600 text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin mr-2">⟳</span>
      ) : null}
      {children}
    </button>
  );
};