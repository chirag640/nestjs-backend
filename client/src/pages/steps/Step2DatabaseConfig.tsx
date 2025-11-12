import { useWizardStore } from '@/lib/store';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { InputField } from '@/components/wizard/InputField';
import { SelectField } from '@/components/wizard/SelectField';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Step2DatabaseConfig() {
  const { config, updateDatabaseConfig } = useWizardStore();
  const dbConfig = config.databaseConfig!;
  const [showConnectionString, setShowConnectionString] = useState(false);

  const getProviderOptions = () => {
    const { databaseType } = dbConfig;
    if (databaseType === 'PostgreSQL') {
      return [
        { value: 'Neon', label: 'Neon' },
        { value: 'Supabase', label: 'Supabase' },
        { value: 'Railway', label: 'Railway' },
      ];
    } else if (databaseType === 'MongoDB') {
      return [
        { value: 'Atlas', label: 'MongoDB Atlas' },
      ];
    } else {
      return [
        { value: 'PlanetScale', label: 'PlanetScale' },
        { value: 'Railway', label: 'Railway' },
      ];
    }
  };

  return (
    <WizardLayout
      title="Database Configuration"
      description="Configure your database connection and migration strategy"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Database Type"
            value={dbConfig.databaseType}
            onChange={(value) => updateDatabaseConfig({ databaseType: value as any })}
            options={[
              { value: 'PostgreSQL', label: 'PostgreSQL' },
              { value: 'MongoDB', label: 'MongoDB' },
              { value: 'MySQL', label: 'MySQL' },
            ]}
            tooltip="Select the database system you want to use"
            testId="select-database-type"
          />

          <SelectField
            label="Provider"
            value={dbConfig.provider}
            onChange={(value) => updateDatabaseConfig({ provider: value as any })}
            options={getProviderOptions()}
            tooltip="Select your database hosting provider"
            testId="select-provider"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Connection String
            <span className="text-destructive ml-1">*</span>
          </Label>
          <div className="relative">
            <Input
              type={showConnectionString ? 'text' : 'password'}
              value={dbConfig.connectionString}
              onChange={(e) => updateDatabaseConfig({ connectionString: e.target.value })}
              placeholder="postgresql://username:password@host:port/database"
              className="pr-10"
              data-testid="input-connection-string"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowConnectionString(!showConnectionString)}
              data-testid="button-toggle-visibility"
            >
              {showConnectionString ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your database connection string will be stored securely
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Auto Migration</Label>
          <ToggleGroup
            type="single"
            value={dbConfig.autoMigration}
            onValueChange={(val) => val && updateDatabaseConfig({ autoMigration: val as any })}
            className="justify-start"
            data-testid="toggle-auto-migration"
          >
            <ToggleGroupItem
              value="push"
              aria-label="Push migrations automatically"
              data-testid="toggle-option-push"
            >
              Push (Auto)
            </ToggleGroupItem>
            <ToggleGroupItem
              value="manual"
              aria-label="Manual migrations"
              data-testid="toggle-option-manual"
            >
              Manual
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-xs text-muted-foreground">
            {dbConfig.autoMigration === 'push'
              ? 'Database schema will be automatically synchronized'
              : 'You will manage migrations manually'}
          </p>
        </div>
      </div>
    </WizardLayout>
  );
}
