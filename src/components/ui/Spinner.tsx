import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

const sizes: Record<NonNullable<SpinnerProps['size']>, string> = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

/**
 * The single spinner idiom for the whole app. Replaces the three ad-hoc
 * variants previously in use (border spinner, raw Loader2, pulse).
 */
export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={label || 'Loading'}
      className={cn('animate-spin text-primary-500', sizes[size], className)}
    />
  );
}

export default Spinner;
