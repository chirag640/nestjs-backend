import { useWizardStore } from '@/lib/store';
import Step1ProjectSetup from './steps/Step1ProjectSetup';
import Step2DatabaseConfig from './steps/Step2DatabaseConfig';
import Step3ModelBuilder from './steps/Step3ModelBuilder';
import Step4AuthSetup from './steps/Step4AuthSetup';
import Step5FeatureSelection from './steps/Step5FeatureSelection';
import Step6Review from './steps/Step6Review';
import { useEffect } from 'react';

export default function Wizard() {
  const currentStep = useWizardStore((state) => state.currentStep);
  const { nextStep, previousStep } = useWizardStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
          e.preventDefault();
          nextStep();
        }
      } else if (e.key === 'Backspace' && e.ctrlKey) {
        e.preventDefault();
        previousStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextStep, previousStep]);

  switch (currentStep) {
    case 1:
      return <Step1ProjectSetup />;
    case 2:
      return <Step2DatabaseConfig />;
    case 3:
      return <Step3ModelBuilder />;
    case 4:
      return <Step4AuthSetup />;
    case 5:
      return <Step5FeatureSelection />;
    case 6:
      return <Step6Review />;
    default:
      return <Step1ProjectSetup />;
  }
}
