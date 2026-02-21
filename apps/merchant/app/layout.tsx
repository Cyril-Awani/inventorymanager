import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	userScalable: false,
};

export const metadata: Metadata = {
	title: 'Pures Web POS | Mini Supermarket Management',
	description:
		'Professional Point of Sale system for Nigerian mini-supermarkets with offline-first functionality',
	generator: 'v0.app',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={`${inter.className} font-sans antialiased`}>
				{children}
			</body>
		</html>
	);
}
