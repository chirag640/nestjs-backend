import { useWizardStore } from '@/lib/store';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { InputField } from '@/components/wizard/InputField';
import { SelectField } from '@/components/wizard/SelectField';
import { ToggleField } from '@/components/wizard/ToggleField';
import { useState, useEffect } from 'react';

export default function Step1ProjectSetup() {
  const { config, updateProjectSetup } = useWizardStore();
  const setup = config.projectSetup!;

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const newErrors: Record<string, string> = {};
    if (setup.projectName && !/^[a-z0-9-]+$/.test(setup.projectName)) {
      newErrors.projectName = 'Use lowercase letters, numbers, and hyphens only';
    }
    setErrors(newErrors);
  }, [setup.projectName]);

  return (
    <WizardLayout
      title="Project Setup"
      description="Configure the basic settings for your new project"
    >
      <div className="space-y-6">
        <InputField
          label="Project Name"
          value={setup.projectName}
          onChange={(value) => updateProjectSetup({ projectName: value })}
          placeholder="my-awesome-project"
          required
          error={errors.projectName}
          tooltip="Use kebab-case format (lowercase with hyphens)"
          testId="input-project-name"
        />

        <InputField
          label="Description"
          value={setup.description}
          onChange={(value) => updateProjectSetup({ description: value })}
          placeholder="A brief description of your project"
          required
          type="textarea"
          testId="textarea-description"
        />

        <InputField
          label="Author"
          value={setup.author}
          onChange={(value) => updateProjectSetup({ author: value })}
          placeholder="Your name or organization"
          required
          testId="input-author"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="License"
            value={setup.license}
            onChange={(value) => updateProjectSetup({ license: value as any })}
            options={[
              { value: 'MIT', label: 'MIT' },
              { value: 'Apache-2.0', label: 'Apache 2.0' },
              { value: 'GPL-3.0', label: 'GPL 3.0' },
              { value: 'BSD-3-Clause', label: 'BSD 3-Clause' },
              { value: 'ISC', label: 'ISC' },
            ]}
            testId="select-license"
          />

          <SelectField
            label="Node.js Version"
            value={setup.nodeVersion}
            onChange={(value) => updateProjectSetup({ nodeVersion: value as any })}
            options={[
              { value: '18', label: 'Node.js 18 LTS' },
              { value: '20', label: 'Node.js 20 LTS' },
              { value: '22', label: 'Node.js 22' },
            ]}
            tooltip="Select the Node.js version for your project"
            testId="select-node-version"
          />
        </div>

        <ToggleField
          label="Package Manager"
          value={setup.packageManager}
          onChange={(value) => updateProjectSetup({ packageManager: value as any })}
          options={[
            { value: 'npm', label: 'npm' },
            { value: 'yarn', label: 'Yarn' },
            { value: 'pnpm', label: 'pnpm' },
          ]}
          testId="toggle-package-manager"
        />
      </div>
    </WizardLayout>
  );
}
