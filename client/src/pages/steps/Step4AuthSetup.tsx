import { useWizardStore } from '@/lib/store';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { SelectField } from '@/components/wizard/SelectField';
import { InputField } from '@/components/wizard/InputField';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const DEFAULT_PERMISSIONS = [
  'create',
  'read',
  'update',
  'delete',
  'manage_users',
  'manage_roles',
];

export default function Step4AuthSetup() {
  const { config, updateAuthConfig } = useWizardStore();
  const authConfig = config.authConfig!;
  const [newRole, setNewRole] = useState('');

  const addRole = () => {
    if (!newRole.trim() || authConfig.roles.includes(newRole.trim())) return;

    const updatedRoles = [...authConfig.roles, newRole.trim()];
    const updatedPermissions = { ...authConfig.permissions };

    if (!updatedPermissions[newRole.trim()]) {
      updatedPermissions[newRole.trim()] = [];
    }

    updateAuthConfig({
      roles: updatedRoles,
      permissions: updatedPermissions,
    });

    setNewRole('');
  };

  const removeRole = (role: string) => {
    const updatedRoles = authConfig.roles.filter((r) => r !== role);
    const updatedPermissions = { ...authConfig.permissions };
    delete updatedPermissions[role];

    updateAuthConfig({
      roles: updatedRoles,
      permissions: updatedPermissions,
    });
  };

  const togglePermission = (role: string, permission: string) => {
    const rolePermissions = authConfig.permissions[role] || [];
    const hasPermission = rolePermissions.includes(permission);

    const updatedPermissions = {
      ...authConfig.permissions,
      [role]: hasPermission
        ? rolePermissions.filter((p) => p !== permission)
        : [...rolePermissions, permission],
    };

    updateAuthConfig({ permissions: updatedPermissions });
  };

  return (
    <WizardLayout
      title="Authentication & Authorization"
      description="Configure authentication providers and role-based access control"
    >
      <div className="space-y-8">
        {/* Auth Provider Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wide opacity-60">
            Authentication Provider
          </h3>

          <SelectField
            label="Provider"
            value={authConfig.provider}
            onChange={(value) => updateAuthConfig({ provider: value as any })}
            options={[
              { value: 'JWT', label: 'JWT (JSON Web Tokens)' },
              { value: 'OAuth', label: 'OAuth 2.0' },
              { value: 'NextAuth', label: 'NextAuth.js' },
            ]}
            tooltip="Select your authentication strategy"
            testId="select-auth-provider"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="JWT Secret Key"
              value={authConfig.jwtSecret}
              onChange={(value) => updateAuthConfig({ jwtSecret: value })}
              placeholder="your-secret-key-here"
              required
              type="password"
              tooltip="Secret key for signing JWT tokens"
              testId="input-jwt-secret"
            />

            <InputField
              label="JWT Expiration"
              value={authConfig.jwtExpiration}
              onChange={(value) => updateAuthConfig({ jwtExpiration: value })}
              placeholder="7d"
              required
              tooltip="Token expiration time (e.g., 7d, 24h, 30m)"
              testId="input-jwt-expiration"
            />
          </div>
        </div>

        {/* Role Management */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wide opacity-60">
            User Roles
          </h3>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-medium">Add Role</Label>
              <Input
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="admin, user, moderator..."
                onKeyDown={(e) => e.key === 'Enter' && addRole()}
                data-testid="input-new-role"
              />
            </div>
            <Button onClick={addRole} disabled={!newRole.trim()} data-testid="button-add-role">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {authConfig.roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {authConfig.roles.map((role) => (
                <div
                  key={role}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md text-sm"
                  data-testid={`role-badge-${role}`}
                >
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
        </div>

        {/* RBAC Permission Matrix */}
        {authConfig.roles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wide opacity-60">
              Permission Matrix
            </h3>

            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="border border-white/10 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-secondary/30">
                      <tr>
                        <th
                          scope="col"
                          className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wide"
                        >
                          Permission
                        </th>
                        {authConfig.roles.map((role) => (
                          <th
                            key={role}
                            scope="col"
                            className="py-3 px-4 text-center text-xs font-medium uppercase tracking-wide"
                            data-testid={`header-role-${role}`}
                          >
                            {role}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {DEFAULT_PERMISSIONS.map((permission) => (
                        <tr key={permission} className="hover-elevate">
                          <td className="py-3 px-4 text-sm font-medium">
                            {permission.replace('_', ' ')}
                          </td>
                          {authConfig.roles.map((role) => (
                            <td key={role} className="py-3 px-4 text-center">
                              <Checkbox
                                checked={
                                  authConfig.permissions[role]?.includes(permission) || false
                                }
                                onCheckedChange={() => togglePermission(role, permission)}
                                data-testid={`checkbox-permission-${role}-${permission}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {authConfig.roles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Add at least one role to configure permissions</p>
          </div>
        )}
      </div>
    </WizardLayout>
  );
}
