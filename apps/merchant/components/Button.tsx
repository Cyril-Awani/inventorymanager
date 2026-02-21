import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	isLoading?: boolean;
	children: React.ReactNode;
}

const buttonVariants = {
	primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
	secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400',
	danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
	ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
};

const buttonSizes = {
	sm: 'px-3 py-1.5 text-sm',
	md: 'px-4 py-2 text-base',
	lg: 'px-6 py-3 text-lg',
};

export function Button({
	variant = 'primary',
	size = 'md',
	isLoading = false,
	disabled = false,
	children,
	className = '',
	...props
}: ButtonProps) {
	return (
		<button
			disabled={disabled || isLoading}
			className={`
        inline-flex items-center justify-center
        rounded-lg font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${buttonVariants[variant]}
        ${buttonSizes[size]}
        ${className}
      `}
			{...props}
		>
			{isLoading ? (
				<>
					<div className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-current rounded-full mr-2" />
					Loading...
				</>
			) : (
				children
			)}
		</button>
	);
}
