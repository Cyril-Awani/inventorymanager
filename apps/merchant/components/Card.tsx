'use client';

import React from 'react';

interface CardProps {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
	return (
		<div
			className={`
        bg-white rounded-lg border border-gray-200
        shadow-sm hover:shadow-md transition-shadow duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
			onClick={onClick}
		>
			{children}
		</div>
	);
}

interface CardHeaderProps {
	children: React.ReactNode;
	className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
	return (
		<div className={`p-4 border-b border-gray-200 ${className}`}>
			{children}
		</div>
	);
}

interface CardBodyProps {
	children: React.ReactNode;
	className?: string;
}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
	({ children, className = '' }, ref) => {
		return (
			<div ref={ref} className={`p-4 ${className}`}>
				{children}
			</div>
		);
	},
);

interface CardFooterProps {
	children: React.ReactNode;
	className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
	return (
		<div className={`p-4 border-t border-gray-200 flex gap-3 ${className}`}>
			{children}
		</div>
	);
}
