import { useWizardStore } from "@/lib/store";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { SelectField } from "@/components/wizard/SelectField";
import { InputField } from "@/components/wizard/InputField";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Shield,
  Info,
  Lock,
  RefreshCw,
  CheckCircle,
  Database,
} from "lucide-react";
import { useState } from "react";

export default function Step4AuthSetup() {
  const { config, updateAuthConfig } = useWizardStore();
  const authConfig = config.authConfig!;
  const [newRole, setNewRole] = useState("");

  const addRole = () => {
    if (!newRole.trim() || authConfig.roles.includes(newRole.trim())) return;

    const updatedRoles = [...authConfig.roles, newRole.trim()];
    updateAuthConfig({ roles: updatedRoles });
    setNewRole("");
  };

  const removeRole = (role: string) => {
    const updatedRoles = authConfig.roles.filter((r) => r !== role);
    updateAuthConfig({ roles: updatedRoles });
  };

  const updateJwtConfig = (field: string, value: string | boolean) => {
    const existingJwt = authConfig.jwt || {};
    const newJwt = {
      ...existingJwt,
      [field]: value,
    };
    updateAuthConfig({ jwt: newJwt });
  };

  return (
    <WizardLayout
      title="Authentication & Authorization"
      description="Configure JWT-based authentication and role-based access control (RBAC)"
    >
      <div className="space-y-8">
        {/* Enable Authentication Toggle */}
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-4">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base">
                    Enable Authentication
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add JWT-based authentication with /auth/register,
                    /auth/login, and /auth/refresh endpoints
                  </p>
                </div>
                <Switch
                  checked={authConfig.enabled}
                  onCheckedChange={(checked) =>
                    updateAuthConfig({ enabled: checked })
                  }
                  data-testid="toggle-auth-enabled"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Show User Model Auto-Generation Notice */}
        {authConfig.enabled && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <AlertDescription>
              <div className="flex items-start gap-2">
                <Database className="w-4 h-4 mt-0.5 text-green-500" />
                <div>
                  <strong className="text-green-600 dark:text-green-400">
                    User Model Auto-Generated
                  </strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    A{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      User
                    </code>{" "}
                    model will be automatically created with fields:{" "}
                    <strong>email</strong>, <strong>password</strong>, and{" "}
                    <strong>role</strong>. You can add custom fields (firstName,
                    avatar, etc.) in the Model Definition step. This model will
                    be available for relationships with other models.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Show config only if auth is enabled */}
        {authConfig.enabled && (
          <>
            {/* JWT Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium uppercase tracking-wide">
                  JWT Configuration
                </h3>
              </div>

              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  JWT tokens will be signed using the{" "}
                  <strong>JWT_SECRET</strong> environment variable. Access
                  tokens are short-lived for security, while refresh tokens
                  enable seamless re-authentication.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Access Token Expiry"
                  value={authConfig.jwt?.accessTTL || "15m"}
                  onChange={(value) => updateJwtConfig("accessTTL", value)}
                  placeholder="15m"
                  required
                  tooltip="How long access tokens are valid (e.g., 15m, 1h, 24h)"
                  testId="input-access-ttl"
                />

                <InputField
                  label="Refresh Token Expiry"
                  value={authConfig.jwt?.refreshTTL || "7d"}
                  onChange={(value) => updateJwtConfig("refreshTTL", value)}
                  placeholder="7d"
                  required
                  tooltip="How long refresh tokens are valid (e.g., 7d, 30d)"
                  testId="input-refresh-ttl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      <Label className="font-medium">Token Rotation</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Issue new refresh token on each use
                    </p>
                  </div>
                  <Switch
                    checked={authConfig.jwt?.rotation ?? true}
                    onCheckedChange={(checked) =>
                      updateJwtConfig("rotation", checked)
                    }
                    data-testid="toggle-rotation"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <Label className="font-medium">Token Blacklist</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Invalidate refresh tokens on logout
                    </p>
                  </div>
                  <Switch
                    checked={authConfig.jwt?.blacklist ?? true}
                    onCheckedChange={(checked) =>
                      updateJwtConfig("blacklist", checked)
                    }
                    data-testid="toggle-blacklist"
                  />
                </div>
              </div>
            </div>

            {/* Role Management */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium uppercase tracking-wide">
                  User Roles (RBAC)
                </h3>
              </div>

              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Define roles for role-based access control. Use{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    @Roles('Admin')
                  </code>{" "}
                  decorator to protect routes. Default roles:{" "}
                  <strong>Admin</strong>, <strong>User</strong>.
                </AlertDescription>
              </Alert>

              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">Add Role</Label>
                  <Input
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Admin, User, Moderator..."
                    onKeyDown={(e) => e.key === "Enter" && addRole()}
                    data-testid="input-new-role"
                  />
                </div>
                <Button
                  onClick={addRole}
                  disabled={!newRole.trim()}
                  data-testid="button-add-role"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </div>

              {authConfig.roles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {authConfig.roles.map((role) => (
                    <div
                      key={role}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md text-sm font-medium"
                      data-testid={`role-badge-${role}`}
                    >
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span>{role}</span>
                      <button
                        onClick={() => removeRole(role)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        data-testid={`button-delete-role-${role}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {authConfig.roles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No roles defined. Add at least one role for RBAC.</p>
                </div>
              )}
            </div>

            {/* Preview JSON */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Configuration Preview
              </Label>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(
                  {
                    auth: {
                      jwt: authConfig.jwt,
                      roles: authConfig.roles,
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </>
        )}

        {!authConfig.enabled && (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Authentication Disabled</p>
            <p className="text-sm mt-2">
              Enable authentication to configure JWT and roles
            </p>
          </div>
        )}
      </div>
    </WizardLayout>
  );
}
