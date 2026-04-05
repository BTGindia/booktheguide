import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <select
          id={id}
          className={cn(
            'flex h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm transition-colors appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-btg-sand hover:border-btg-terracotta/40',
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
