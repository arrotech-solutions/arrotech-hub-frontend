import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';
import { inputBaseClass, inputBorderClass } from './Input';

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, invalid, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(
          inputBaseClass,
          inputBorderClass(invalid),
          'resize-y',
          className
        )}
        {...props}
      />
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
