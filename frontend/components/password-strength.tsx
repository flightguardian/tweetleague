'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const [checks, setChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    const newChecks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password)
    };
    
    setChecks(newChecks);
    
    // Calculate strength
    const score = Object.values(newChecks).filter(Boolean).length;
    setStrength(score * 20);
  }, [password]);

  const getStrengthColor = () => {
    if (strength <= 20) return 'bg-red-500';
    if (strength <= 40) return 'bg-orange-500';
    if (strength <= 60) return 'bg-yellow-500';
    if (strength <= 80) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strength <= 20) return 'Very Weak';
    if (strength <= 40) return 'Weak';
    if (strength <= 60) return 'Fair';
    if (strength <= 80) return 'Good';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Password strength:</span>
        <span className={`font-medium ${strength >= 60 ? 'text-green-600' : 'text-orange-600'}`}>
          {getStrengthText()}
        </span>
      </div>
      
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strength}%` }}
        />
      </div>

      <div className="space-y-1 text-xs">
        <div className={`flex items-center gap-2 ${checks.length ? 'text-green-600' : 'text-gray-400'}`}>
          {checks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          At least 8 characters
        </div>
        <div className={`flex items-center gap-2 ${checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
          {checks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          One uppercase letter
        </div>
        <div className={`flex items-center gap-2 ${checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
          {checks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          One lowercase letter
        </div>
        <div className={`flex items-center gap-2 ${checks.number ? 'text-green-600' : 'text-gray-400'}`}>
          {checks.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          One number
        </div>
        <div className={`flex items-center gap-2 ${checks.special ? 'text-green-600' : 'text-gray-400'}`}>
          {checks.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          One special character
        </div>
      </div>
    </div>
  );
}