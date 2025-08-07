'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';

interface ScoreInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

export function ScoreInput({ value, onChange, label, disabled }: ScoreInputProps) {
  const numValue = parseInt(value) || 0;

  const increment = () => {
    if (numValue < 10) {
      onChange((numValue + 1).toString());
    }
  };

  const decrement = () => {
    if (numValue > 0) {
      onChange((numValue - 1).toString());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '' || (parseInt(newValue) >= 0 && parseInt(newValue) <= 10)) {
      onChange(newValue);
    }
  };

  return (
    <div className="text-center">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        {label}
      </label>
      <div className="relative inline-flex flex-col items-center">
        <button
          type="button"
          onClick={increment}
          disabled={disabled || numValue >= 10}
          className={cn(
            "w-10 h-10 rounded-full bg-[rgb(98,181,229)] text-white hover:bg-[rgb(78,145,183)] transition-all",
            "flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
          )}
        >
          <Plus className="h-5 w-5" />
        </button>
        
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "w-20 h-20 my-2 text-center text-4xl font-bold",
            "border-3 border-gray-200 rounded-2xl",
            "focus:border-[rgb(98,181,229)] focus:outline-none focus:ring-4 focus:ring-[rgb(98,181,229)]/20",
            "transition-all shadow-lg",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          )}
        />
        
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || numValue <= 0}
          className={cn(
            "w-10 h-10 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition-all",
            "flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
          )}
        >
          <Minus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}