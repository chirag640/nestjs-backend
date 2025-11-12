import { useWizardStore } from '@/lib/store';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { Card } from '@/components/ui/card';
import { Lock, Database, GitBranch, CheckCircle2, TestTube2, Container } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    id: 'authentication' as const,
    icon: Lock,
    title: 'Authentication',
    description: 'Secure user authentication with JWT, OAuth, or session-based auth',
  },
  {
    id: 'orm' as const,
    icon: Database,
    title: 'ORM',
    description: 'Database ORM with Prisma, Drizzle, or TypeORM for type-safe queries',
  },
  {
    id: 'ci-cd' as const,
    icon: GitBranch,
    title: 'CI/CD',
    description: 'Automated testing and deployment pipelines with GitHub Actions',
  },
  {
    id: 'linting' as const,
    icon: CheckCircle2,
    title: 'Linting & Formatting',
    description: 'ESLint and Prettier configuration for code quality and consistency',
  },
  {
    id: 'testing' as const,
    icon: TestTube2,
    title: 'Testing Framework',
    description: 'Unit and integration testing with Jest, Vitest, or Playwright',
  },
  {
    id: 'docker' as const,
    icon: Container,
    title: 'Docker Support',
    description: 'Containerization with Docker and Docker Compose for easy deployment',
  },
];

export default function Step5FeatureSelection() {
  const { config, updateFeatureSelection } = useWizardStore();
  const selectedFeatures = config.featureSelection?.features || [];

  const toggleFeature = (featureId: typeof FEATURES[number]['id']) => {
    const isSelected = selectedFeatures.includes(featureId);
    const updatedFeatures = isSelected
      ? selectedFeatures.filter((f) => f !== featureId)
      : [...selectedFeatures, featureId];

    updateFeatureSelection({ features: updatedFeatures });
  };

  return (
    <WizardLayout
      title="Feature Selection"
      description="Select the features and tools you want to include in your project"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((feature) => {
          const isSelected = selectedFeatures.includes(feature.id);
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid={`feature-card-${feature.id}`}
            >
              <Card
                onClick={() => toggleFeature(feature.id)}
                className={`p-6 cursor-pointer transition-all duration-150 hover-elevate ${
                  isSelected
                    ? 'border-primary border-2 bg-primary/5'
                    : 'border-white/10'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-primary/20 border border-primary/30'
                          : 'bg-secondary/50'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {selectedFeatures.length === 0 && (
        <div className="text-center mt-8 text-muted-foreground">
          <p className="text-sm">Select features to include in your project (optional)</p>
        </div>
      )}

      {selectedFeatures.length > 0 && (
        <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedFeatures.length}</span> feature
            {selectedFeatures.length !== 1 && 's'} selected
          </p>
        </div>
      )}
    </WizardLayout>
  );
}
