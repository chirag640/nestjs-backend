import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  tooltip?: string;
  type?: 'text' | 'textarea' | 'password';
  testId?: string;
}

export function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  tooltip,
  type = 'text',
  testId,
}: InputFieldProps) {
  const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={inputId} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {type === 'textarea' ? (
        <Textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`resize-none ${error ? 'border-destructive' : ''}`}
          rows={3}
          data-testid={testId || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
      ) : (
        <Input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={error ? 'border-destructive' : ''}
          data-testid={testId || `input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
