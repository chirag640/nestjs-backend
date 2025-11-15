import { useWizardStore } from "@/lib/store";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, Plus, Trash2, Key, Shield } from "lucide-react";
import { useState } from "react";
import type { OAuthProvider } from "@/../../shared/schema";

export default function Step4_1OAuthConfig() {
  const { config, updateOAuthConfig } = useWizardStore();
  const oauthConfig = config.oauthConfig || { enabled: false, providers: [] };
  const [editingProvider, setEditingProvider] = useState<string | null>(null);

  const toggleOAuth = (enabled: boolean) => {
    updateOAuthConfig({ ...oauthConfig, enabled });
  };

  const addProvider = () => {
    const newProvider: OAuthProvider = {
      name: "google",
      clientId: "",
      clientSecret: "",
      callbackURL: `${window.location.origin}/auth/oauth/google/callback`,
    };
    updateOAuthConfig({
      ...oauthConfig,
      providers: [...oauthConfig.providers, newProvider],
    });
    setEditingProvider(`${oauthConfig.providers.length}`);
  };

  const removeProvider = (index: number) => {
    const updated = oauthConfig.providers.filter((_, i) => i !== index);
    updateOAuthConfig({ ...oauthConfig, providers: updated });
    if (editingProvider === `${index}`) {
      setEditingProvider(null);
    }
  };

  const updateProvider = (
    index: number,
    field: keyof OAuthProvider,
    value: string
  ) => {
    const updated = oauthConfig.providers.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    updateOAuthConfig({ ...oauthConfig, providers: updated });
  };

  const getCallbackURL = (providerName: string) => {
    return `${window.location.origin}/auth/oauth/${providerName}/callback`;
  };

  return (
    <WizardLayout
      title="OAuth2 Configuration"
      description="Configure third-party authentication providers (Google, GitHub)"
    >
      <div className="space-y-6">
        {/* Enable OAuth Toggle */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold">Enable OAuth2 Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Allow users to sign in with Google or GitHub
                </p>
              </div>
            </div>
            <Switch
              checked={oauthConfig.enabled}
              onCheckedChange={toggleOAuth}
            />
          </div>
        </Card>

        {oauthConfig.enabled && (
          <>
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                You'll need to create OAuth apps in{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Google Cloud Console
                </a>{" "}
                and{" "}
                <a
                  href="https://github.com/settings/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  GitHub Developer Settings
                </a>
                . Copy the Client ID and Secret here.
              </AlertDescription>
            </Alert>

            {/* Provider List */}
            <div className="space-y-4">
              {oauthConfig.providers.map((provider, index) => (
                <Card key={index} className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-muted-foreground" />
                        <h4 className="font-semibold capitalize">
                          {provider.name} OAuth
                        </h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProvider(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {/* Provider Selection */}
                      <div className="space-y-2">
                        <Label>Provider</Label>
                        <Select
                          value={provider.name}
                          onValueChange={(value: "google" | "github") =>
                            updateProvider(index, "name", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="google">Google</SelectItem>
                            <SelectItem value="github">GitHub</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Client ID */}
                      <div className="space-y-2">
                        <Label>Client ID</Label>
                        <Input
                          placeholder="xxx.apps.googleusercontent.com"
                          value={provider.clientId}
                          onChange={(e) =>
                            updateProvider(index, "clientId", e.target.value)
                          }
                        />
                      </div>

                      {/* Client Secret */}
                      <div className="space-y-2">
                        <Label>Client Secret</Label>
                        <Input
                          type="password"
                          placeholder="GOCSPX-xxxx"
                          value={provider.clientSecret}
                          onChange={(e) =>
                            updateProvider(
                              index,
                              "clientSecret",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      {/* Callback URL (read-only) */}
                      <div className="space-y-2">
                        <Label>Callback URL (Auto-generated)</Label>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={getCallbackURL(provider.name)}
                            className="bg-muted"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                getCallbackURL(provider.name)
                              );
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Add this URL to your OAuth app's authorized redirect
                          URIs
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Add Provider Button */}
              {oauthConfig.providers.length < 2 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addProvider}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add OAuth Provider
                </Button>
              )}
            </div>

            {/* Summary */}
            {oauthConfig.providers.length > 0 && (
              <Card className="p-4 bg-secondary/30">
                <p className="text-sm font-medium">
                  {oauthConfig.providers.length} provider(s) configured
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Users will see "Sign in with{" "}
                  {oauthConfig.providers.map((p) => p.name).join(" / ")}"
                  buttons
                </p>
              </Card>
            )}
          </>
        )}

        {!oauthConfig.enabled && (
          <Card className="p-6 text-center border-dashed">
            <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-2">OAuth2 is disabled</h3>
            <p className="text-sm text-muted-foreground">
              Enable it above to add Google or GitHub authentication
            </p>
          </Card>
        )}
      </div>
    </WizardLayout>
  );
}
