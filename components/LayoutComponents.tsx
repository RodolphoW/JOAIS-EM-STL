import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'surface' | 'ghost';
  fullWidth?: boolean;
}

export const NeumorphButton: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'surface', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyle = "transition-all duration-300 active:scale-95 rounded-2xl font-medium py-4 px-6 flex items-center justify-center gap-2";
  
  const variants = {
    surface: "bg-surface text-gray-300 shadow-neumorph hover:text-gold",
    primary: "bg-gradient-to-r from-gold to-gold-dark text-white shadow-neumorph-gold",
    ghost: "bg-transparent text-gray-400 hover:text-white"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const NeumorphCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ 
  children, 
  className = '',
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-surface rounded-3xl shadow-neumorph p-4 ${className} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
    >
      {children}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  endIcon?: React.ReactNode;
  onIconClick?: () => void;
}

export const NeumorphInput: React.FC<InputProps> = ({ endIcon, onIconClick, className = '', ...props }) => {
  return (
    <div className="relative w-full">
      <input 
        className={`w-full bg-background rounded-2xl py-4 pl-6 ${endIcon ? 'pr-12' : 'pr-6'} shadow-neumorph-pressed text-gray-200 outline-none placeholder-gray-500 focus:text-gold transition-colors ${className}`}
        {...props}
      />
      {endIcon && (
        <button 
          type="button"
          onClick={onIconClick}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold transition-colors p-1"
        >
          {endIcon}
        </button>
      )}
    </div>
  );
};