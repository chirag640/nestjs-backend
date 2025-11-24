import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  Activity,
  AlertTriangle,
} from "lucide-react";

/**
 * Permission Manager - Admin UI for Field-Level Access Control (FLAC)
 *
 * Features:
 * - View all permission rules
 * - Create/Edit/Delete rules
 * - Filter by role or entity
 * - View access logs
 * - View access statistics
 * - Test permissions
 *
 * Usage:
 * Add this component to your admin dashboard:
 * <PermissionManager apiBaseUrl="http://localhost:3000" authToken={adminToken} />
 */

interface FieldAccessRule {
  _id: string;
  role: string;
  entityName?: string;
  allowSelfOnly: boolean;
  allow: string[];
  deny: string[];
  allowRead: boolean;
  allowWrite: boolean;
  allowDelete: boolean;
  priority: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface AccessLog {
  _id: string;
  userId: string;
  role: string;
  entityName: string;
  action: "read" | "write" | "delete";
  deniedFields: string[];
  granted: boolean;
  ipAddress?: string;
  createdAt: string;
}

interface AccessStats {
  total: number;
  granted: number;
  denied: number;
  denialRate: string;
  byAction: Array<{ _id: string; count: number }>;
  byRole: Array<{ _id: string; count: number }>;
}

interface PermissionManagerProps {
  apiBaseUrl: string;
  authToken: string;
}

export function PermissionManager({
  apiBaseUrl,
  authToken,
}: PermissionManagerProps) {
  const [rules, setRules] = useState<FieldAccessRule[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [stats, setStats] = useState<AccessStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FieldAccessRule | null>(null);
  const [formData, setFormData] = useState({
    role: "",
    entityName: "",
    allowSelfOnly: false,
    allow: "",
    deny: "",
    allowRead: true,
    allowWrite: false,
    allowDelete: false,
    priority: 0,
    description: "",
  });

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const API_URL = `${apiBaseUrl}/field-access`;

  // Fetch rules
  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/rules`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch rules");
      const data = await response.json();
      setRules(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/logs?limit=50`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create rule
  const createRule = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...formData,
        allow: formData.allow
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        deny: formData.deny
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        entityName: formData.entityName || undefined,
      };

      const response = await fetch(`${API_URL}/rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create rule");

      setSuccess("Rule created successfully!");
      setIsDialogOpen(false);
      resetForm();
      fetchRules();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update rule
  const updateRule = async () => {
    if (!editingRule) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...formData,
        allow: formData.allow
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        deny: formData.deny
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        entityName: formData.entityName || undefined,
      };

      const response = await fetch(`${API_URL}/rules/${editingRule._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update rule");

      setSuccess("Rule updated successfully!");
      setIsDialogOpen(false);
      setEditingRule(null);
      resetForm();
      fetchRules();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete rule
  const deleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${API_URL}/rules/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) throw new Error("Failed to delete rule");

      setSuccess("Rule deleted successfully!");
      fetchRules();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle rule active state
  const toggleRuleActive = async (id: string, isActive: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isActive ? "deactivate" : "activate";
      const response = await fetch(`${API_URL}/rules/${id}/${endpoint}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) throw new Error(`Failed to ${endpoint} rule`);

      setSuccess(`Rule ${endpoint}d successfully!`);
      fetchRules();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      role: "",
      entityName: "",
      allowSelfOnly: false,
      allow: "",
      deny: "",
      allowRead: true,
      allowWrite: false,
      allowDelete: false,
      priority: 0,
      description: "",
    });
  };

  const openEditDialog = (rule: FieldAccessRule) => {
    setEditingRule(rule);
    setFormData({
      role: rule.role,
      entityName: rule.entityName || "",
      allowSelfOnly: rule.allowSelfOnly,
      allow: rule.allow.join(", "),
      deny: rule.deny.join(", "),
      allowRead: rule.allowRead,
      allowWrite: rule.allowWrite,
      allowDelete: rule.allowDelete,
      priority: rule.priority,
      description: rule.description || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchRules();
    fetchStats();
  }, []);

  // Filter rules
  const filteredRules = rules.filter((rule) => {
    if (roleFilter !== "all" && rule.role !== roleFilter) return false;
    if (entityFilter !== "all" && rule.entityName !== entityFilter)
      return false;
    return true;
  });

  // Get unique roles and entities
  const uniqueRoles = Array.from(new Set(rules.map((r) => r.role)));
  const uniqueEntities = Array.from(
    new Set(
      rules.map((r) => r.entityName).filter((e): e is string => Boolean(e))
    )
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Permission Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage field-level access control (FLAC) for all roles
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Permission Rules</TabsTrigger>
          <TabsTrigger value="logs" onClick={fetchLogs}>
            Access Logs
          </TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Filter by Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {uniqueRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Filter by Entity</Label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    {uniqueEntities.map((entity) => (
                      <SelectItem key={entity} value={entity}>
                        {entity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Rules Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Self-Only</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Denied Fields</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No rules found. Create your first rule!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map((rule) => (
                    <TableRow key={rule._id}>
                      <TableCell className="font-medium">
                        <Badge>{rule.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {rule.entityName ? (
                          <Badge variant="outline">{rule.entityName}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Global</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {rule.allowSelfOnly ? (
                          <Badge variant="secondary">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {rule.allowRead && (
                            <Badge variant="outline">Read</Badge>
                          )}
                          {rule.allowWrite && (
                            <Badge variant="outline">Write</Badge>
                          )}
                          {rule.allowDelete && (
                            <Badge variant="outline">Delete</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-muted-foreground">
                          {rule.deny.length > 0 ? rule.deny.join(", ") : "None"}
                        </div>
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() =>
                            toggleRuleActive(rule._id, rule.isActive)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(rule)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteRule(rule._id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Denied Fields</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No access logs yet
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-mono text-sm">
                        {log.userId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.role}</Badge>
                      </TableCell>
                      <TableCell>{log.entityName}</TableCell>
                      <TableCell>
                        <Badge>{log.action}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.granted ? (
                          <Badge className="bg-green-500">Granted</Badge>
                        ) : (
                          <Badge variant="destructive">Denied</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.deniedFields.length > 0
                          ? log.deniedFields.join(", ")
                          : "None"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Requests
                    </p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Granted</p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.granted}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Denied</p>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.denied}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Denial Rate</p>
                    <p className="text-3xl font-bold">{stats.denialRate}</p>
                  </div>
                  <Shield className="h-8 w-8 text-orange-500" />
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Permission Rule" : "Create Permission Rule"}
            </DialogTitle>
            <DialogDescription>
              Configure field-level access control for a specific role and
              entity
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role *</Label>
                <Input
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="user, admin, doctor, etc."
                />
              </div>
              <div>
                <Label>Entity (Optional)</Label>
                <Input
                  value={formData.entityName}
                  onChange={(e) =>
                    setFormData({ ...formData, entityName: e.target.value })
                  }
                  placeholder="Worker, Order, etc."
                />
              </div>
            </div>

            <div>
              <Label>Allowed Fields (comma-separated)</Label>
              <Input
                value={formData.allow}
                onChange={(e) =>
                  setFormData({ ...formData, allow: e.target.value })
                }
                placeholder="*, email, name, profile.address"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use * to allow all fields, or specify field paths
              </p>
            </div>

            <div>
              <Label>Denied Fields (comma-separated)</Label>
              <Input
                value={formData.deny}
                onChange={(e) =>
                  setFormData({ ...formData, deny: e.target.value })
                }
                placeholder="ssn, salary, sensitiveEncrypted.*"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deny overrides allow. Use dot notation for nested fields
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.allowSelfOnly}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allowSelfOnly: checked })
                }
              />
              <Label>Allow Self-Only Access</Label>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.allowRead}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allowRead: checked })
                    }
                  />
                  <Label>Read</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.allowWrite}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allowWrite: checked })
                    }
                  />
                  <Label>Write</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.allowDelete}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allowDelete: checked })
                    }
                  />
                  <Label>Delete</Label>
                </div>
              </div>
            </div>

            <div>
              <Label>Priority</Label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value),
                  })
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Higher priority rules are applied first
              </p>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief explanation of this rule"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={editingRule ? updateRule : createRule}
                disabled={loading || !formData.role}
              >
                {loading
                  ? "Saving..."
                  : editingRule
                    ? "Update Rule"
                    : "Create Rule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
