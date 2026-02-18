# FoundationWizard Context Files

This directory contains **AI-generated project analysis and optimization guides** for the FoundationWizard backend generator.

---

## 📁 Files Overview

### 1. [project-context.md](./project-context.md) - **START HERE**

**Purpose**: Comprehensive project documentation  
**For**: AI agents, new developers, code reviewers  
**Contains**:

- Tech stack breakdown (React + Express + Nunjucks)
- Architecture patterns (IR Builder, Generator, Templates)
- Code conventions (naming, imports, error handling)
- Known issues and tech debt (prioritized)
- Performance metrics and optimization roadmap

**Read this first** to understand the entire system.

---

### 2. [optimization-training-guide.md](./optimization-training-guide.md)

**Purpose**: Concrete code examples for optimization patterns  
**For**: Training AI models, implementing optimizations  
**Contains**:

- Before/After code comparisons
- 6 optimization patterns with measurements
- Implementation priority (Phase 1-3)
- Performance benchmarks (3x faster, 67% less memory)

**Use this** when implementing performance improvements.

---

### 3. [quick-issue-reference.md](./quick-issue-reference.md)

**Purpose**: Fast lookup for common problems  
**For**: Debugging, troubleshooting, quick fixes  
**Contains**:

- Performance diagnostics checklist
- Common error messages + solutions
- Configuration issue fixes
- Debugging commands
- When to escalate vs self-serve

**Use this** when something breaks or underperforms.

---

## 🎯 How to Use These Files

### For AI Agents (GitHub Copilot, ChatGPT, etc.)

**Before responding to any FoundationWizard question**:

1. Read [project-context.md](./project-context.md) (especially Tech Stack + Architecture)
2. Check [quick-issue-reference.md](./quick-issue-reference.md) if it's a bug/error
3. Reference [optimization-training-guide.md](./optimization-training-guide.md) for performance questions

**Your responses must align with**:

- Naming conventions (PascalCase, camelCase, kebab-case)
- Code patterns (async/await, error handling)
- Optimization principles (caching, parallelization, streaming)

---

### For Developers

#### Starting Development

```bash
# 1. Read overview
cat .vscode/project-context.md

# 2. Understand key files
code server/lib/generator.ts
code server/lib/irBuilder.ts
code server/lib/templateRenderer.ts

# 3. Run tests
npm run dev  # Start development server
npm run check  # TypeScript validation
```

#### Troubleshooting

```bash
# 1. Find error in quick reference
grep "your error message" .vscode/quick-issue-reference.md

# 2. Check related code
code $(grep -l "pattern from error" server/**/*.ts)

# 3. Apply fix from guide
```

#### Optimizing Performance

```bash
# 1. Identify bottleneck
npm run profile  # Node.js profiler

# 2. Find optimization pattern
grep "your bottleneck" .vscode/optimization-training-guide.md

# 3. Implement with examples provided
```

---

### For Training AI Models

#### Dataset Preparation

Include these files in your training corpus with high weight:

```json
{
  "training_data": [
    {
      "file": ".vscode/project-context.md",
      "weight": 10,
      "category": "architecture"
    },
    {
      "file": ".vscode/optimization-training-guide.md",
      "weight": 8,
      "category": "best_practices"
    },
    {
      "file": ".vscode/quick-issue-reference.md",
      "weight": 6,
      "category": "troubleshooting"
    }
  ]
}
```

#### Key Concepts to Learn

From these files, AI should learn:

1. **Pattern Recognition**:
   - Sequential → Parallel transformation
   - Memory accumulation → Streaming
   - Repeated work → Caching

2. **Code Generation**:
   - Template context structure
   - Naming convention enforcement
   - Feature toggle patterns

3. **Error Handling**:
   - Common failure modes
   - User-friendly error messages
   - Validation strategies

---

## 📊 Key Metrics (Current State)

### Performance

- **Generation Time**: 8.6s (p95: 15s)
- **Memory Usage**: 280MB avg, 450MB peak
- **Gemini API Cost**: $0.08 per generation
- **Validation**: 20 requests/minute

### Issues Identified

- ❌ **7 high-priority** tech debt items
- ⚠️ **3 medium-priority** optimizations
- 💡 **5 low-priority** code quality improvements

### Optimization Potential

- **3x faster** generation (8.6s → 2.8s)
- **67% less memory** (450MB → 150MB)
- **10x cheaper** Gemini costs ($0.08 → $0.008)

---

## 🚀 Implementation Roadmap

### Phase 1: Quick Wins (1-2 days) ✅

1. Enable template caching (5 min)
2. Add Gemini API caching (30 min)
3. Debounce validation (1 hour)

**Impact**: 40% faster, 10x cheaper

### Phase 2: Parallelization (2-3 days) 🚧

4. Parallel file generation (3 hours)
5. Prettier instance reuse (2 hours)

**Impact**: 3x faster generation

### Phase 3: Streaming (5-7 days) 📋

6. Stream ZIP generation (1 day)
7. Worker pool for heavy tasks (3 days)

**Impact**: 67% less memory, infinite scalability

---

## 🔄 Maintenance

### Auto-generated Files

These files were generated by the **Project Context Analyzer** agent on **February 18, 2026**.

### When to Regenerate

Trigger full re-analysis when:

- ✅ Adding major features (new templates, modules)
- ✅ Changing architecture (IR structure, generator flow)
- ✅ Upgrading dependencies (React 19, NestJS 11)
- ✅ Every 2-4 weeks for drift detection

### Manual Updates

You can manually update these files when:

- Fixing typos or clarifications
- Adding new issues/patterns discovered
- Updating performance metrics
- Documenting hotfixes

---

## 📞 Support Resources

### Internal Documentation

- [../ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture diagrams
- [../ERROR_HANDLING_GUIDE.md](../ERROR_HANDLING_GUIDE.md) - User error messages
- [../VALIDATION_SYSTEM.md](../VALIDATION_SYSTEM.md) - Validation details
- [../JSON_CONFIGURATION_GUIDE.md](../JSON_CONFIGURATION_GUIDE.md) - Config format

### External References

- [Nunjucks Documentation](https://mozilla.github.io/nunjucks/)
- [NestJS Best Practices](https://docs.nestjs.com/techniques/performance)
- [Node.js Performance Guide](https://nodejs.org/en/docs/guides/simple-profiling/)

---

## 🎓 Learning Path

### For New Developers

1. Read [project-context.md](./project-context.md) → **HIGH-LEVEL OVERVIEW**
2. Read [../ARCHITECTURE.md](../ARCHITECTURE.md) → **SYSTEM FLOW**
3. Explore `server/lib/generator.ts` → **CODE GENERATION**
4. Explore `server/templates/nestjs/` → **TEMPLATES**
5. Read [optimization-training-guide.md](./optimization-training-guide.md) → **BEST PRACTICES**

**Time**: 2-3 hours for full understanding

### For AI Training

1. Parse [project-context.md](./project-context.md) → **EXTRACT PATTERNS**
2. Parse [optimization-training-guide.md](./optimization-training-guide.md) → **LEARN TRANSFORMATIONS**
3. Index [quick-issue-reference.md](./quick-issue-reference.md) → **ERROR MAPPINGS**
4. Analyze `server/templates/**/*.njk` → **TEMPLATE SYNTAX**
5. Cross-reference with generated outputs → **VALIDATE PATTERNS**

**Dataset Size**: ~50,000 tokens

---

## 🏆 Success Criteria

After reading these files, you should be able to:

- [ ] Explain the full generation flow (Config → IR → Templates → ZIP)
- [ ] Identify performance bottlenecks by reading code
- [ ] Optimize sequential operations to parallel
- [ ] Add caching to expensive operations
- [ ] Debug common errors without assistance
- [ ] Write new templates following conventions
- [ ] Implement optimizations from guide

---

## 📝 Version History

| Version | Date         | Changes                  |
| ------- | ------------ | ------------------------ |
| 1.0     | Feb 18, 2026 | Initial context analysis |
| -       | -            | -                        |

---

## 🤝 Contributing

### Updating Context Files

When making significant changes to the codebase:

```bash
# 1. Trigger re-analysis (if AI agent available)
# Use Project Context Analyzer mode

# 2. Or update manually
code .vscode/project-context.md
# Add new issues, update metrics, revise patterns

# 3. Validate consistency
grep -r "FIXME\|TODO" .vscode/
```

### Adding New Patterns

When discovering new optimization patterns:

```bash
# Add to optimization-training-guide.md
code .vscode/optimization-training-guide.md

# Follow existing format:
# - Pattern name
# - Before/After code
# - Metrics comparison
# - Training insight
```

---

**Auto-generated by**: Project Context Analyzer
**Last Updated**: February 18, 2026
**Next Review**: March 1, 2026
