import { useWizardStore } from '@/lib/store';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useState } from 'react';
import type { Model, Field } from '@shared/schema';
import { nanoid } from 'nanoid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

function SortableFieldItem({ field, onUpdate, onDelete }: { field: Field; onUpdate: (field: Field) => void; onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-4 hover-elevate"
      data-testid={`field-card-${field.id}`}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab active:cursor-grabbing touch-none"
          data-testid="button-drag-field"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Field Name</Label>
              <Input
                value={field.name}
                onChange={(e) => onUpdate({ ...field, name: e.target.value })}
                placeholder="fieldName"
                className="h-9"
                data-testid="input-field-name"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={field.type}
                onValueChange={(value) => onUpdate({ ...field, type: value as any })}
              >
                <SelectTrigger className="h-9" data-testid="select-field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UUID">UUID</SelectItem>
                  <SelectItem value="String">String</SelectItem>
                  <SelectItem value="Boolean">Boolean</SelectItem>
                  <SelectItem value="Int">Int</SelectItem>
                  <SelectItem value="Float">Float</SelectItem>
                  <SelectItem value="DateTime">DateTime</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`required-${field.id}`}
                checked={field.required}
                onCheckedChange={(checked) => onUpdate({ ...field, required: !!checked })}
                data-testid="checkbox-required"
              />
              <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">
                Required
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id={`unique-${field.id}`}
                checked={field.unique}
                onCheckedChange={(checked) => onUpdate({ ...field, unique: !!checked })}
                data-testid="checkbox-unique"
              />
              <Label htmlFor={`unique-${field.id}`} className="text-xs cursor-pointer">
                Unique
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id={`primary-${field.id}`}
                checked={field.primaryKey}
                onCheckedChange={(checked) => onUpdate({ ...field, primaryKey: !!checked })}
                data-testid="checkbox-primary-key"
              />
              <Label htmlFor={`primary-${field.id}`} className="text-xs cursor-pointer">
                Primary Key
              </Label>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
          data-testid="button-delete-field"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

export default function Step3ModelBuilder() {
  const { config, updateModelDefinition } = useWizardStore();
  const models = config.modelDefinition?.models || [];
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [newModelName, setNewModelName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedModel = models.find((m) => m.id === selectedModelId);

  const addModel = () => {
    if (!newModelName.trim()) return;

    const newModel: Model = {
      id: nanoid(),
      name: newModelName,
      fields: [
        {
          id: nanoid(),
          name: 'id',
          type: 'UUID',
          required: true,
          unique: true,
          primaryKey: true,
        },
      ],
    };

    updateModelDefinition({ models: [...models, newModel] });
    setSelectedModelId(newModel.id);
    setNewModelName('');
  };

  const addField = () => {
    if (!selectedModel) return;

    const newField: Field = {
      id: nanoid(),
      name: '',
      type: 'String',
      required: false,
      unique: false,
      primaryKey: false,
    };

    const updatedModels = models.map((m) =>
      m.id === selectedModelId
        ? { ...m, fields: [...m.fields, newField] }
        : m
    );

    updateModelDefinition({ models: updatedModels });
  };

  const updateField = (fieldId: string, updatedField: Field) => {
    if (!selectedModel) return;

    const updatedModels = models.map((m) =>
      m.id === selectedModelId
        ? { ...m, fields: m.fields.map((f) => (f.id === fieldId ? updatedField : f)) }
        : m
    );

    updateModelDefinition({ models: updatedModels });
  };

  const deleteField = (fieldId: string) => {
    if (!selectedModel) return;

    const updatedModels = models.map((m) =>
      m.id === selectedModelId
        ? { ...m, fields: m.fields.filter((f) => f.id !== fieldId) }
        : m
    );

    updateModelDefinition({ models: updatedModels });
  };

  const deleteModel = (modelId: string) => {
    const updatedModels = models.filter((m) => m.id !== modelId);
    updateModelDefinition({ models: updatedModels });
    if (selectedModelId === modelId) {
      setSelectedModelId(updatedModels[0]?.id || null);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!selectedModel || !over || active.id === over.id) return;

    const oldIndex = selectedModel.fields.findIndex((f) => f.id === active.id);
    const newIndex = selectedModel.fields.findIndex((f) => f.id === over.id);

    const newFields = arrayMove(selectedModel.fields, oldIndex, newIndex);

    const updatedModels = models.map((m) =>
      m.id === selectedModelId ? { ...m, fields: newFields } : m
    );

    updateModelDefinition({ models: updatedModels });
  };

  // Generate React Flow nodes and edges
  const flowNodes: Node[] = models.map((model, idx) => ({
    id: model.id,
    type: 'default',
    position: { x: 50 + (idx % 3) * 250, y: 50 + Math.floor(idx / 3) * 200 },
    data: {
      label: (
        <div className="p-2">
          <div className="font-semibold text-sm mb-1">{model.name}</div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            {model.fields.slice(0, 3).map((f) => (
              <div key={f.id}>
                {f.name}: {f.type}
              </div>
            ))}
            {model.fields.length > 3 && (
              <div className="italic">+{model.fields.length - 3} more</div>
            )}
          </div>
        </div>
      ),
    },
    style: {
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--card-border))',
      borderRadius: '8px',
      color: 'hsl(var(--card-foreground))',
      width: 200,
    },
  }));

  const flowEdges: Edge[] = [];

  return (
    <WizardLayout
      title="Model Definition"
      description="Design your data models with fields and relationships"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Model & Field Builder */}
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-medium">Add Model</Label>
              <Input
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="ModelName"
                onKeyDown={(e) => e.key === 'Enter' && addModel()}
                data-testid="input-new-model"
              />
            </div>
            <Button onClick={addModel} disabled={!newModelName.trim()} data-testid="button-add-model">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {models.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Model</Label>
              <Select value={selectedModelId || undefined} onValueChange={setSelectedModelId}>
                <SelectTrigger data-testid="select-model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedModel && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Fields</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteModel(selectedModel.id)}
                    className="text-destructive"
                    data-testid="button-delete-model"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete Model
                  </Button>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedModel.fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {selectedModel.fields.map((field) => (
                      <SortableFieldItem
                        key={field.id}
                        field={field}
                        onUpdate={(updatedField) => updateField(field.id, updatedField)}
                        onDelete={() => deleteField(field.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <Button
                variant="outline"
                className="w-full"
                onClick={addField}
                data-testid="button-add-field"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>
          )}

          {models.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Create your first model to get started</p>
            </div>
          )}
        </div>

        {/* Right: Entity Diagram */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Entity Diagram</Label>
          <div className="h-[500px] border border-white/10 rounded-lg bg-background/50">
            {models.length > 0 ? (
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                fitView
                className="rounded-lg"
              >
                <Background />
                <Controls />
              </ReactFlow>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Add your first model to see relationships
              </div>
            )}
          </div>
        </div>
      </div>
    </WizardLayout>
  );
}
