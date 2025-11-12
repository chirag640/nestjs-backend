import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  tooltip?: string;
  testId?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  tooltip,
  testId,
}: SelectFieldProps) {
  const selectId = `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={selectId} className="text-sm font-medium">
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

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={selectId}
          data-testid={testId || `select-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              data-testid={`option-${option.value}`}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
