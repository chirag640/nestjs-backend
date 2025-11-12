# Design Guidelines: Project Setup Wizard

## Design Approach
**Reference-Based:** Drawing inspiration from **Linear, Vercel, and Raycast** for their developer-focused, refined dark interfaces with exceptional clarity and polish.

## Core Design Principles
1. **Clarity over decoration** - Each step should be instantly understandable
2. **Progressive disclosure** - Show only what's needed at each step
3. **Visual feedback** - Every interaction provides clear state changes
4. **Professional restraint** - Minimal animations, maximum utility

---

## Typography System

**Font Family:** Inter (via Google Fonts CDN)
- Primary: Inter 400 (regular), 500 (medium), 600 (semibold)

**Hierarchy:**
- Wizard Title: `text-2xl font-semibold` (Step header)
- Section Headers: `text-sm font-medium uppercase tracking-wide opacity-60` 
- Input Labels: `text-sm font-medium`
- Body Text: `text-base`
- Helper Text: `text-sm opacity-70`
- Code/Technical: `font-mono text-sm`

---

## Layout System

**Spacing Units:** Tailwind's 4, 6, 8, 12, 16, 24 (p-4, gap-6, mb-8, etc.)

**Structure:**
- Centered wizard card: `max-w-4xl mx-auto` 
- Card padding: `p-8` on desktop, `p-6` on mobile
- Form field spacing: `space-y-6` for major sections, `space-y-4` for related fields
- Section breaks: `mb-12` between major groups

**Grid Layouts:**
- Feature cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- RBAC matrix: `grid grid-cols-[200px_repeat(4,1fr)] gap-2`
- Two-column forms: `grid grid-cols-1 md:grid-cols-2 gap-6`

---

## Component Library

### Navigation
- **Progress Bar:** Horizontal stepped indicator showing 1/6, 2/6, etc. with filled/unfilled states
- **Previous/Next Buttons:** Full-width on mobile, inline on desktop (Previous: subtle outline, Next: primary solid)
- **Step Breadcrumbs:** Small dots with connecting lines above main content

### Form Elements
- **Input Fields:** Border thickness `border-2`, rounded `rounded-lg`, padding `px-4 py-3`
- **Dropdowns:** Native select with custom styling, chevron icon on right
- **Toggle Groups:** Segmented button group with radio behavior (e.g., npm/yarn/pnpm)
- **Checkboxes:** Custom styled with checkmark icon from Lucide
- **Masked Input:** Connection string field with eye icon to toggle visibility

### Interactive Components
- **Drag-Drop Field Builder:** Vertical list of field cards with grip handle icons, "Add Field" button at bottom
- **Entity Diagram:** React Flow canvas taking 50% of screen width, dark nodes with rounded corners
- **Permission Matrix:** Grid of checkboxes with role names as column headers, permissions as rows
- **Feature Cards:** Hoverable cards with icon, title, description - selected state shows border accent
- **Code Preview Panel:** Syntax-highlighted JSON in scrollable container with copy button

### Feedback Elements
- **Validation Messages:** Red text below fields, shake animation on error
- **Tooltips:** Dark overlay with white text, arrow pointer, triggered on info icon hover
- **Loading States:** Spinner with percentage text for generation step
- **Success Indicators:** Green checkmark icons for completed steps

---

## Visual Treatments

**Borders:**
- Default: `border border-white/10`
- Focus: `border-2 border-blue-500`
- Selected: `border-2 border-blue-400`

**Shadows:**
- Cards: `shadow-xl shadow-black/50`
- Modals/Popovers: `shadow-2xl`
- Buttons on hover: `shadow-lg shadow-blue-500/20`

**Transitions:**
- Step changes: Slide with `x-4` offset, `duration-300`
- Button hovers: `transition-all duration-150`
- Card selections: Scale `scale-[1.02]` + subtle glow

---

## Accessibility

- All form fields have visible labels
- Focus states use 2px outline with offset
- Error messages linked to inputs via aria-describedby
- Keyboard navigation: Enter for Next, Backspace for Previous
- Color contrast maintains 4.5:1 minimum ratio
- Interactive elements minimum 44x44px touch target

---

## Screen-Specific Layouts

**Step 1 (Project Setup):** Single column form, toggles in horizontal group

**Step 2 (Database Config):** Two-column grid (Type + Provider on top row, connection string full-width below)

**Step 3 (Model Builder):** Split screen - Field builder (left 50%), Diagram (right 50%)

**Step 4 (Auth Setup):** Provider selection at top, RBAC matrix dominates center

**Step 5 (Features):** 3-column grid of feature cards with ample whitespace

**Step 6 (Review):** Left sidebar with navigation sections, right panel with code preview

---

## Icons
**Library:** Lucide Icons (via CDN)
- Plus, Trash2, GripVertical (model builder)
- Database, Lock, Code2 (feature icons)
- ChevronDown (dropdowns)
- Eye, EyeOff (password masking)
- Copy, Download (actions)

---

## Critical UX Details

- Auto-save indicator appears as subtle "Saved" text in top-right
- Disabled Next button has reduced opacity and no pointer cursor
- Edit buttons in review screen highlight their target step number
- Long connection strings show first/last characters with ellipsis in middle
- Empty state in diagram shows "Add your first model to see relationships"