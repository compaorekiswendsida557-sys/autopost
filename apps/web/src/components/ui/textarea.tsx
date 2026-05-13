'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: number;
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  className,
  label,
  error,
  hint,
  charCount,
  maxChars,
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {maxChars !== undefined && charCount !== undefined && (
            <span className={cn('text-xs', charCount > maxChars ? 'text-red-500' : 'text-gray-400')}>
              {charCount}/{maxChars}
            </span>
          )}
        </div>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900',
          'placeholder:text-gray-400 outline-none transition-all duration-200 resize-none',
          'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
          'disabled:bg-gray-50 disabled:text-gray-500',
          error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
