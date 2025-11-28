import { useWizardStore } from "@/lib/store";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Network, Info } from "lucide-react";
import { useState } from "react";
import type { Relationship, Field } from "@/../../shared/schema";
import { nanoid } from "nanoid";

export default function Step3_1RelationshipConfig() {
  const { config, updateModelDefinition } = useWizardStore();
  const relationships = config.modelDefinition?.relationships || [];
  const models = config.modelDefinition?.models || [];
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addRelationship = () => {
    const newRelationship: Relationship = {
      id: nanoid(),
      type: "one-to-many",
      sourceModel: models[0]?.name || "",
      targetModel: models[1]?.name || "",
      fieldName: "",
      through: "",
      attributes: [],
    };

    updateModelDefinition({
      relationships: [...relationships, newRelationship],
    });
    setEditingIndex(relationships.length);
  };

  const updateRelationship = (
    index: number,
    updates: Partial<Relationship>
  ) => {
    const updated = [...relationships];
    updated[index] = { ...updated[index], ...updates };
    updateModelDefinition({ relationships: updated });
  };

  const removeRelationship = (index: number) => {
    const updated = relationships.filter((_, i) => i !== index);
    updateModelDefinition({ relationships: updated });
    if (editingIndex === index) setEditingIndex(null);
  };

  const addAttribute = (relationshipIndex: number) => {
    const relationship = relationships[relationshipIndex];
    const newAttribute: Field = {
      id: nanoid(),
      name: "",
      type: "string",
      required: false,
      unique: false,
      indexed: false,
    };

    updateRelationship(relationshipIndex, {
      attributes: [...(relationship.attributes || []), newAttribute],
    });
  };

  const updateAttribute = (
    relationshipIndex: number,
    attributeIndex: number,
    updates: Partial<Field>
  ) => {
    const relationship = relationships[relationshipIndex];
    const updatedAttributes = [...(relationship.attributes || [])];
    updatedAttributes[attributeIndex] = {
      ...updatedAttributes[attributeIndex],
      ...updates,
    };
    updateRelationship(relationshipIndex, { attributes: updatedAttributes });
  };

  const removeAttribute = (
    relationshipIndex: number,
    attributeIndex: number
  ) => {
    const relationship = relationships[relationshipIndex];
    const updatedAttributes = (relationship.attributes || []).filter(
      (_, i) => i !== attributeIndex
    );
    updateRelationship(relationshipIndex, { attributes: updatedAttributes });
  };

  const getRelationshipDescription = (rel: Relationship) => {
    const typeDescriptions = {
      "one-to-one": "Each record in both models has exactly one related record",
      "one-to-many": `Each ${rel.sourceModel} can have multiple ${rel.targetModel}`,
      "many-to-one": `Multiple ${rel.sourceModel} can relate to one ${rel.targetModel}`,
      "many-to-many": `Multiple ${rel.sourceModel} can relate to multiple ${rel.targetModel}`,
    };
    return typeDescriptions[rel.type] || "";
  };

  const needsJoinModel = (rel: Relationship) => {
    return (
      rel.type === "many-to-many" && rel.attributes && rel.attributes.length > 0
    );
  };

  return (
    <WizardLayout
      title="Model Relationships"
      description="Define relationships between your models"
    >
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Configure relationships between models. Many-to-many relationships
            with custom fields will automatically generate join models.
          </AlertDescription>
        </Alert>

        {/* Summary Card */}
        <Card className="p-4 border-2 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Relationships Defined</p>
                <p className="text-sm text-muted-foreground">
                  {relationships.length} relationship
                  {relationships.length !== 1 ? "s" : ""} configured
                </p>
              </div>
            </div>
            <Button onClick={addRelationship} disabled={models.length < 2}>
              <Plus className="h-4 w-4 mr-2" />
              Add Relationship
            </Button>
          </div>
        </Card>

        {models.length < 2 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You need at least 2 models to define relationships. Please add
              more models in the previous step.
            </AlertDescription>
          </Alert>
        )}

        {/* Relationships List */}
        <div className="space-y-4">
          {relationships.map((relationship, index) => (
            <Card
              key={index}
              className={`p-6 ${
                editingIndex === index ? "border-2 border-primary" : ""
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Relationship #{index + 1}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditingIndex(editingIndex === index ? null : index)
                      }
                    >
                      {editingIndex === index ? "Collapse" : "Expand"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRelationship(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Relationship Type */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Relationship Type</Label>
                    <Select
                      value={relationship.type}
                      onValueChange={(value: Relationship["type"]) =>
                        updateRelationship(index, { type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-to-one">One-to-One</SelectItem>
                        <SelectItem value="one-to-many">One-to-Many</SelectItem>
                        <SelectItem value="many-to-many">
                          Many-to-Many
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getRelationshipDescription(relationship)}
                    </p>
                  </div>
                </div>

                {editingIndex === index && (
                  <>
                    {/* Model Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Source Model</Label>
                        <Select
                          value={relationship.sourceModel}
                          onValueChange={(value) =>
                            updateRelationship(index, { sourceModel: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {models.map((model) => (
                              <SelectItem key={model.name} value={model.name}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Target Model</Label>
                        <Select
                          value={relationship.targetModel}
                          onValueChange={(value) =>
                            updateRelationship(index, { targetModel: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {models
                              .filter(
                                (m) => m.name !== relationship.sourceModel
                              )
                              .map((model) => (
                                <SelectItem key={model.name} value={model.name}>
                                  {model.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Field Name */}
                    <div>
                      <Label>Field Name</Label>
                      <Input
                        placeholder="e.g., posts, author, tags"
                        value={relationship.fieldName}
                        onChange={(e) =>
                          updateRelationship(index, {
                            fieldName: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Name of the field in {relationship.sourceModel} that
                        references {relationship.targetModel}
                      </p>
                    </div>

                    {/* Advanced Options */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Foreign Key Name (Optional)</Label>
                        <Input
                          placeholder="e.g., authorId"
                          value={relationship.foreignKeyName || ""}
                          onChange={(e) =>
                            updateRelationship(index, {
                              foreignKeyName: e.target.value,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Custom name for the foreign key field. Defaults to{" "}
                          {relationship.sourceModel
                            ? `${relationship.sourceModel.charAt(0).toLowerCase() + relationship.sourceModel.slice(1)}Id`
                            : "modelId"}
                        </p>
                      </div>

                      <div>
                        <Label>Inverse Field Name (Optional)</Label>
                        <Input
                          placeholder="e.g., posts"
                          value={relationship.inverseFieldName || ""}
                          onChange={(e) =>
                            updateRelationship(index, {
                              inverseFieldName: e.target.value,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Name of the virtual field on the other model.
                        </p>
                      </div>
                    </div>

                    {/* Join Model (Many-to-Many) */}
                    {relationship.type === "many-to-many" && (
                      <div>
                        <Label>Join Model Name (Optional)</Label>
                        <Input
                          placeholder="e.g., UserRole, PostTag"
                          value={relationship.through || ""}
                          onChange={(e) =>
                            updateRelationship(index, {
                              through: e.target.value,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Custom name for the join table. Leave empty for
                          default naming.
                        </p>
                      </div>
                    )}

                    {/* Attributes (Many-to-Many) */}
                    {relationship.type === "many-to-many" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Join Model Attributes (Optional)</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addAttribute(index)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Field
                          </Button>
                        </div>

                        {relationship.attributes &&
                          relationship.attributes.length > 0 && (
                            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                              {relationship.attributes.map(
                                (attr, attrIndex) => (
                                  <div
                                    key={attrIndex}
                                    className="flex gap-2 items-end"
                                  >
                                    <div className="flex-1">
                                      <Input
                                        placeholder="Field name"
                                        value={attr.name}
                                        onChange={(e) =>
                                          updateAttribute(index, attrIndex, {
                                            name: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="w-32">
                                      <Select
                                        value={attr.type}
                                        onValueChange={(value) =>
                                          updateAttribute(index, attrIndex, {
                                            type: value as Field["type"],
                                          })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="string">
                                            String
                                          </SelectItem>
                                          <SelectItem value="number">
                                            Number
                                          </SelectItem>
                                          <SelectItem value="boolean">
                                            Boolean
                                          </SelectItem>
                                          <SelectItem value="date">
                                            Date
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeAttribute(index, attrIndex)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                        {needsJoinModel(relationship) && (
                          <Alert className="mt-2">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              A join model will be automatically generated with
                              these custom fields.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>

        {relationships.length === 0 && models.length >= 2 && (
          <div className="text-center py-12 text-muted-foreground">
            <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No relationships defined yet.</p>
            <p className="text-sm">Click "Add Relationship" to get started.</p>
          </div>
        )}
      </div>
    </WizardLayout>
  );
}
