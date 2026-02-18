# FoundationWizard - Quick Issue Reference

**Fast lookup for common problems and solutions**

---

## 🔍 QUICK DIAGNOSTICS

### Performance Issues

#### Symptom: Generation takes >10 seconds

**Checklist**:

- [ ] Check if `noCache: true` in [templateRenderer.ts](../server/lib/templateRenderer.ts#L16)
- [ ] Count files: >100 files → Enable parallel generation
- [ ] Check Prettier calls: >50 → Batch formatting
- [ ] Monitor memory: >400MB → Enable streaming

**Quick Fix**:

```typescript
// templateRenderer.ts line 16
noCache: process.env.NODE_ENV === 'development', // ✅ Cache in production
```

#### Symptom: High memory usage (>400MB)

**Checklist**:

- [ ] Check session count: `sessions.size > 20` → Add LRU cache
- [ ] Check file accumulation: Generating >100 files → Use streaming
- [ ] Check Gemini calls: Not cached → Add `geminiCache`

**Quick Fix**:

```typescript
// Use streaming generator instead of array accumulation
async function* generateFilesStreaming() {
  /* ... */
}
```

#### Symptom: Slow validation (>2 seconds)

**Checklist**:

- [ ] Check template validation: Using `existsSync` in loop → Parallelize
- [ ] Check model validation: Complex relationships → Optimize algorithm
- [ ] Check API calls: Validating on every render → Add debounce + cache

**Quick Fix**:

```typescript
// Add debounce to validation
const debouncedConfig = useDebouncedValue(config, 500);
```

---

## 🐛 COMMON ERRORS

### Error: "Template not found"

**Cause**: Template file doesn't exist or wrong path

**Debug Steps**:

1. Check template path in generator.ts
2. Verify file exists: `ls server/templates/[path]`
3. Check feature toggle in template mapping

**Example**:

```typescript
// ❌ WRONG
{ template: "auth/jwt-strategy.njk", ... }

// ✅ CORRECT
{ template: "auth/strategies/jwt-strategy.njk", ... }
```

**Prevention**: Add validation in `ValidationService`

```typescript
validateTemplates(config, errors) {
  if (config.authConfig.enabled) {
    const templatePath = join(this.templatesPath, 'auth/strategies/jwt-strategy.njk');
    if (!existsSync(templatePath)) {
      errors.push({
        path: 'authConfig',
        message: 'JWT strategy template not found',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }
  }
}
```

---

### Error: "Cannot read property 'X' of undefined"

**Cause**: Template expects context property that wasn't provided

**Debug Steps**:

1. Check which template failed (error stack trace)
2. Open template, find `{{ X }}` or `{% if X %}`
3. Check if IR builder sets property `X`

**Example Error**:

```
Error rendering template nestjs/main.ts.njk:
Cannot read property 'port' of undefined
```

**Fix**:

```typescript
// irBuilder.ts - Make sure property exists
export function buildIR(config: WizardConfig): ProjectIR {
  return {
    project: {
      name: config.projectSetup.projectName,
      port: config.projectSetup.port || 3000, // ✅ Add default
      // ...
    },
  };
}
```

**Prevention**: Use Nunjucks default filter

```nunjucks
{# Template: Provide fallback #}
const PORT = {{ project.port | default(3000) }};
```

---

### Error: "Prettier formatting failed"

**Cause**: Generated code has syntax errors

**Debug Steps**:

1. Find which file failed (check console.error)
2. Inspect `rendered` content before formatting
3. Check template logic (missing brackets, quotes)

**Example**:

```typescript
// Template generates invalid code
import { Module } from '@nestjs/common';
{% if auth.enabled %}
import { AuthModule } from './auth/auth.module';
// ❌ Missing closing bracket
```

**Fix**:

```nunjucks
{# Always match brackets #}
{% if auth.enabled %}
import { AuthModule } from './auth/auth.module';
{% endif %}
```

**Prevention**: Add bracket matching validation

```typescript
function validateTemplateOutput(content: string): boolean {
  const openBrackets = (content.match(/\{/g) || []).length;
  const closeBrackets = (content.match(/\}/g) || []).length;
  return openBrackets === closeBrackets;
}
```

---

### Error: "Validation failed: Model name must be PascalCase"

**Cause**: User entered model name in wrong case

**User Action Required**: Change `user` → `User`

**Auto-fix** (if desired):

```typescript
// In store.ts - Auto-convert to PascalCase
updateModelDefinition: (data) => {
  if (data.models) {
    data.models = data.models.map((model) => ({
      ...model,
      name: toPascalCase(model.name), // ✅ Auto-fix
    }));
  }
  set((state) => ({ config: { ...state.config, modelDefinition: data } }));
};
```

---

### Error: "Gemini API quota exceeded"

**Cause**: Too many API calls, no caching

**Immediate Fix**: Disable Gemini enhancement

```typescript
// irBuilder.ts - Add flag
const USE_GEMINI = process.env.GEMINI_ENABLED === "true";

if (USE_GEMINI) {
  const enhanced = await geminiService.enhanceValidation(field);
  field.enhancedValidators = enhanced;
} else {
  field.enhancedValidators = []; // ✅ Skip Gemini
}
```

**Long-term Fix**: Implement caching (see [optimization-training-guide.md](./optimization-training-guide.md#pattern-4-gemini-ai-caching))

---

## 🎨 UI/UX Issues

### Issue: Validation errors not visible

**Cause**: Frontend not displaying `validationResult.errors`

**Check**:

```tsx
// Step6Review.tsx
{
  validationResult?.errors.map((error, i) => (
    <div key={i} className="error">
      <strong>{error.path}</strong>: {error.message}
      <p className="suggestion">{error.suggestion}</p>
    </div>
  ));
}
```

---

### Issue: Generate button stays disabled

**Cause**: `isStepValid()` returns false, or validation pending

**Debug**:

```tsx
// Check validation state
console.log("Valid:", validationResult?.valid);
console.log("Errors:", validationResult?.errors);
console.log("Is validating:", isValidating);
```

**Fix**: Make sure validation completes

```tsx
const isGenerateEnabled = validationResult?.valid && !isValidating;
```

---

### Issue: Downloaded ZIP is corrupt

**Cause**: Response headers incorrect or ZIP not finalized

**Check**:

```typescript
// routes.ts
res.setHeader("Content-Type", "application/zip"); // ✅ Must be exact
res.setHeader("Content-Disposition", 'attachment; filename="project.zip"');

await archive.finalize(); // ✅ Must call before response ends
```

---

## 🔧 Configuration Issues

### Issue: MongoDB selected but TypeORM generated

**Cause**: ORM detection logic incorrect

**Check**:

```typescript
// irBuilder.ts
const orm =
  config.databaseConfig.databaseType === "MongoDB"
    ? "mongoose"
    : config.databaseConfig.databaseType === "PostgreSQL"
      ? "typeorm"
      : "typeorm"; // Default

// Make sure condition checks exact match
```

---

### Issue: Auth files generated but auth disabled

**Cause**: Generator checks wrong flag

**Check**:

```typescript
// generator.ts
if (ir.auth?.enabled) {
  // ✅ Check enabled flag
  const authFiles = await generateAuthFiles(ir);
  files.push(...authFiles);
}
```

---

### Issue: Relationships not working

**Cause**: Through model not generated for many-to-many

**Check**:

```typescript
// irBuilder.ts - buildRelationshipsIR
if (relationship.type === "many-to-many") {
  if (!relationship.through) {
    // ✅ Auto-generate through model name
    relationship.through = `${fromModel}${toModel}`;
  }
}
```

---

## 📊 Validation Checklist

### Pre-Generation Validation

- [ ] All model names are PascalCase
- [ ] All field names are camelCase
- [ ] No reserved field names (`id`, `_id`, `toString`)
- [ ] Relationships reference existing models
- [ ] Auth enabled → User model exists
- [ ] OAuth enabled → Callback URLs valid
- [ ] Docker enabled → Dockerfile templates exist

### Post-Generation Validation

- [ ] package.json is valid JSON
- [ ] All imports resolve (no missing modules)
- [ ] TypeScript compiles (no syntax errors)
- [ ] ESLint passes (no linting errors)
- [ ] All files have correct file extensions

---

## 🚀 Performance Checklist

### Code Generation

- [ ] Template caching enabled in production
- [ ] Parallel file generation (batch size 10-20)
- [ ] Prettier instance reused
- [ ] Gemini API responses cached

### Memory Management

- [ ] Session cleanup interval running
- [ ] Max sessions limited (LRU cache)
- [ ] Files streamed to ZIP (not accumulated)
- [ ] Large objects not stored in localStorage

### Network Optimization

- [ ] Validation debounced (500ms)
- [ ] Validation results cached (1 minute)
- [ ] Compression middleware enabled
- [ ] Static assets cached (CDN)

---

## 🔍 Debugging Commands

### Check Generation Performance

```bash
# Run with timing
time npm run build

# Profile with Node.js
node --prof server/index.ts
node --prof-process isolate-*.log > profile.txt
```

### Test Generation Locally

```bash
# Debug script with example config
tsx server/scripts/debugGenerate.ts
```

### Check Memory Usage

```bash
# Monitor memory in real-time
node --inspect server/index.ts
# Open chrome://inspect
```

### Validate All Templates Exist

```bash
# List all .njk files
find server/templates -name "*.njk" | wc -l

# Check for missing templates (run validation)
tsx server/scripts/testValidation.ts
```

---

## 🎯 Quick Fixes Summary

| Issue              | File                | Line | Fix              | Time   |
| ------------------ | ------------------- | ---- | ---------------- | ------ |
| Slow generation    | templateRenderer.ts | 16   | `noCache: false` | 1 min  |
| High memory        | generator.ts        | 76   | Use streaming    | 3 hrs  |
| Expensive Gemini   | irBuilder.ts        | -    | Add cache        | 30 min |
| Slow validation    | Step6Review.tsx     | -    | Debounce + cache | 1 hr   |
| Template not found | generator.ts        | -    | Check path       | 5 min  |
| Prettier fails     | template files      | -    | Fix syntax       | 10 min |
| Invalid model name | store.ts            | -    | Auto-convert     | 15 min |

---

## 📞 When to Ask for Help

### Escalate if:

1. ❌ Error occurs in production (not dev)
2. ❌ Data loss or corruption
3. ❌ Security vulnerability
4. ❌ Cannot reproduce issue
5. ❌ Fix requires architecture change

### Self-serve if:

1. ✅ User input validation error
2. ✅ Template syntax error (you can fix)
3. ✅ Performance optimization
4. ✅ Error message unclear (improve wording)
5. ✅ Missing feature (add template)

---

## 📚 Related Documents

- [project-context.md](./project-context.md) - Full project overview
- [optimization-training-guide.md](./optimization-training-guide.md) - Code examples
- [../ERROR_HANDLING_GUIDE.md](../ERROR_HANDLING_GUIDE.md) - User-facing errors
- [../VALIDATION_SYSTEM.md](../VALIDATION_SYSTEM.md) - Validation details

---

**Last Updated**: February 18, 2026
**Maintained by**: AI Context Analyzer
