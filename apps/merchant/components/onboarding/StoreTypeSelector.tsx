'use client';

import React from 'react';
import { Card } from '@/components/Card';

interface StoreType {
	id: string;
	label: string;
	icon: string;
}

interface StoreTypeSelectorProps {
	storeTypes: StoreType[];
	selectedType: string;
	onSelect: (typeId: string) => void;
}

export function StoreTypeSelector({
	storeTypes,
	selectedType,
	onSelect,
}: StoreTypeSelectorProps) {
	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
			{storeTypes.map((type) => (
				<button
					key={type.id}
					onClick={() => onSelect(type.id)}
					className={`p-6 rounded-lg border-2 transition-all ${
						selectedType === type.id
							? 'border-indigo-600 bg-indigo-50'
							: 'border-gray-200 hover:border-indigo-300 bg-white'
					}`}
				>
					<div className="text-4xl mb-2">{type.icon}</div>
					<div className="font-medium text-gray-900 text-sm">{type.label}</div>
				</button>
			))}
		</div>
	);
}
