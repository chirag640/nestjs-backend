import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ToggleFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  testId?: string;
}

export function ToggleField({ label, value, onChange, options, testId }: ToggleFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(val) => val && onChange(val)}
        className="justify-start"
        data-testid={testId || `toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={option.label}
            data-testid={`toggle-option-${option.value}`}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
