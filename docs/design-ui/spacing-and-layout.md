# Spacing & Layout System

> **Spatial design system and layout guidelines for The Phone Guys CRM**

## Spacing Foundation

### Base Unit
Our spacing system is built on a **4px base unit**, providing consistency and flexibility across all components and layouts.

```css
--spacing-base: 0.25rem; /* 4px */
```

### Spacing Scale

| Token | Multiplier | Pixels | Rem | Usage |
|-------|------------|--------|-----|-------|
| space-0 | 0 | 0px | 0 | No spacing |
| space-px | - | 1px | 0.0625 | Border adjustments |
| space-0.5 | 0.125 | 2px | 0.125 | Micro adjustments |
| space-1 | 0.25 | 4px | 0.25 | Tight spacing |
| space-2 | 0.5 | 8px | 0.5 | Small gaps |
| space-3 | 0.75 | 12px | 0.75 | Compact spacing |
| space-4 | 1 | 16px | 1 | Default spacing |
| space-5 | 1.25 | 20px | 1.25 | Medium spacing |
| space-6 | 1.5 | 24px | 1.5 | Comfortable spacing |
| space-8 | 2 | 32px | 2 | Section spacing |
| space-10 | 2.5 | 40px | 2.5 | Large spacing |
| space-12 | 3 | 48px | 3 | Major sections |
| space-14 | 3.5 | 56px | 3.5 | Extra spacing |
| space-16 | 4 | 64px | 4 | Component groups |
| space-20 | 5 | 80px | 5 | Large sections |
| space-24 | 6 | 96px | 6 | Page sections |
| space-32 | 8 | 128px | 8 | Major divisions |
| space-40 | 10 | 160px | 10 | Hero spacing |
| space-48 | 12 | 192px | 12 | Large heroes |
| space-56 | 14 | 224px | 14 | Extra large |
| space-64 | 16 | 256px | 16 | Maximum spacing |

### CSS Custom Properties
```css
:root {
  --space-0: 0;
  --space-px: 1px;
  --space-0\.5: 0.125rem;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-14: 3.5rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  --space-32: 8rem;
  --space-40: 10rem;
  --space-48: 12rem;
  --space-56: 14rem;
  --space-64: 16rem;
}
```

## Layout Grid System

### Container Widths

| Breakpoint | Container Max Width | Padding |
|------------|-------------------|---------|
| Mobile (<640px) | 100% | 16px (space-4) |
| Small (640px) | 640px | 20px (space-5) |
| Medium (768px) | 768px | 24px (space-6) |
| Large (1024px) | 1024px | 32px (space-8) |
| XL (1280px) | 1280px | 32px (space-8) |
| 2XL (1536px) | 1536px | 32px (space-8) |

### Grid Configuration
```css
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
    padding-left: var(--space-5);
    padding-right: var(--space-5);
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
    padding-left: var(--space-6);
    padding-right: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding-left: var(--space-8);
    padding-right: var(--space-8);
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

### 12-Column Grid

```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--space-4);
}

/* Column spans */
.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }
.col-span-4 { grid-column: span 4; }
.col-span-5 { grid-column: span 5; }
.col-span-6 { grid-column: span 6; }
.col-span-7 { grid-column: span 7; }
.col-span-8 { grid-column: span 8; }
.col-span-9 { grid-column: span 9; }
.col-span-10 { grid-column: span 10; }
.col-span-11 { grid-column: span 11; }
.col-span-12 { grid-column: span 12; }
```

## Responsive Breakpoints

### Breakpoint Values
```css
/* Mobile First Breakpoints */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Medium devices */
--breakpoint-lg: 1024px;  /* Large devices */
--breakpoint-xl: 1280px;  /* Extra large devices */
--breakpoint-2xl: 1536px; /* 2X large devices */
```

### Media Query Usage
```css
/* Mobile First Approach */
.element {
  /* Mobile styles (default) */
  padding: var(--space-2);
}

/* Tablet and up */
@media (min-width: 640px) {
  .element {
    padding: var(--space-4);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .element {
    padding: var(--space-6);
  }
}
```

### JavaScript Breakpoints
```typescript
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const mediaQueries = {
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
} as const;
```

## Component Spacing Patterns

### Cards
```css
.card {
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

@media (min-width: 768px) {
  .card {
    padding: var(--space-6);
    margin-bottom: var(--space-6);
  }
}
```

### Buttons
```css
.button {
  padding: var(--space-2) var(--space-4);
  min-height: 44px; /* Touch target */
}

.button-sm {
  padding: var(--space-1) var(--space-3);
  min-height: 32px;
}

.button-lg {
  padding: var(--space-3) var(--space-6);
  min-height: 56px;
}
```

### Forms
```css
.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  margin-bottom: var(--space-1);
}

.form-input {
  padding: var(--space-2) var(--space-3);
  min-height: 44px;
}

.form-help-text {
  margin-top: var(--space-1);
}

.form-error {
  margin-top: var(--space-1);
}
```

### Tables
```css
.table th,
.table td {
  padding: var(--space-3) var(--space-4);
}

.table-compact th,
.table-compact td {
  padding: var(--space-2) var(--space-3);
}

.table-comfortable th,
.table-comfortable td {
  padding: var(--space-4) var(--space-5);
}
```

### Lists
```css
.list-item {
  padding: var(--space-3) 0;
}

.list-item + .list-item {
  border-top: 1px solid var(--border-color);
}

.list-group {
  margin-bottom: var(--space-6);
}
```

## Dashboard Layout

### Fixed Sidebar Layout
```css
.dashboard-layout {
  display: flex;
  min-height: 100vh;
}

.dashboard-sidebar {
  width: 260px;
  padding: var(--space-4);
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.dashboard-main {
  margin-left: 260px;
  flex: 1;
  padding: var(--space-6);
}

/* Mobile responsive */
@media (max-width: 1023px) {
  .dashboard-sidebar {
    transform: translateX(-100%);
    z-index: 40;
  }
  
  .dashboard-sidebar.open {
    transform: translateX(0);
  }
  
  .dashboard-main {
    margin-left: 0;
    padding: var(--space-4);
  }
}
```

### Header Layout
```css
.header {
  height: 64px;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.header-nav {
  display: flex;
  gap: var(--space-6);
}

.header-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
```

## Page Layout Templates

### Standard Page
```tsx
<div className="page-container">
  <header className="page-header mb-6">
    <h1 className="text-h1">Page Title</h1>
    <p className="text-secondary mt-2">Page description</p>
  </header>
  
  <main className="page-content">
    {/* Content sections with consistent spacing */}
    <section className="mb-8">
      {/* Section content */}
    </section>
  </main>
</div>
```

### List View
```tsx
<div className="list-view">
  <div className="list-header mb-4 flex justify-between">
    <h1>Items</h1>
    <button>Add New</button>
  </div>
  
  <div className="list-filters mb-6">
    {/* Filter controls */}
  </div>
  
  <div className="list-content">
    {/* Data table or cards */}
  </div>
  
  <div className="list-pagination mt-6">
    {/* Pagination controls */}
  </div>
</div>
```

### Detail View
```tsx
<div className="detail-view">
  <div className="detail-header mb-6">
    <div className="breadcrumbs mb-4">
      {/* Breadcrumb navigation */}
    </div>
    <h1>Item Details</h1>
  </div>
  
  <div className="detail-body grid grid-cols-12 gap-6">
    <div className="col-span-8">
      {/* Main content */}
    </div>
    <div className="col-span-4">
      {/* Sidebar */}
    </div>
  </div>
</div>
```

### Form Layout
```tsx
<form className="form-layout max-w-2xl">
  <div className="form-section mb-8">
    <h2 className="text-h3 mb-4">Section Title</h2>
    <div className="space-y-4">
      {/* Form fields */}
    </div>
  </div>
  
  <div className="form-actions flex gap-3">
    <button type="submit">Save</button>
    <button type="button">Cancel</button>
  </div>
</form>
```

## Spacing Usage Guidelines

### Consistency Rules

1. **Vertical Rhythm**
   - Maintain consistent vertical spacing
   - Use multiples of base unit (4px)
   - Section spacing: 32px (space-8) minimum
   - Component spacing: 16px (space-4) default

2. **Horizontal Spacing**
   - Container padding: Responsive (16px-32px)
   - Element gaps: 8px (space-2) minimum
   - Button groups: 8px (space-2) gap
   - Form fields: 16px (space-4) between groups

3. **Component Internal Spacing**
   - Cards: 16px (space-4) mobile, 24px (space-6) desktop
   - Buttons: 8px vertical, 16px horizontal
   - Input fields: 8px vertical, 12px horizontal
   - Table cells: 12px vertical, 16px horizontal

### Responsive Spacing

```css
/* Mobile First Spacing */
.component {
  /* Mobile: Compact */
  padding: var(--space-2);
  margin-bottom: var(--space-3);
}

/* Tablet: Comfortable */
@media (min-width: 768px) {
  .component {
    padding: var(--space-4);
    margin-bottom: var(--space-4);
  }
}

/* Desktop: Spacious */
@media (min-width: 1024px) {
  .component {
    padding: var(--space-6);
    margin-bottom: var(--space-6);
  }
}
```

## Z-Index Scale

Managing layering and stacking contexts.

```css
:root {
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-notification: 1080;
}
```

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Base | 0-10 | Normal flow elements |
| Dropdown | 1000 | Dropdown menus |
| Sticky | 1020 | Sticky headers |
| Fixed | 1030 | Fixed sidebars |
| Modal Backdrop | 1040 | Modal overlays |
| Modal | 1050 | Modal dialogs |
| Popover | 1060 | Popovers, tooltips |
| Tooltip | 1070 | Tooltip overlays |
| Notification | 1080 | Toast notifications |

## Aspect Ratios

Common aspect ratios for media containers.

```css
.aspect-square { aspect-ratio: 1 / 1; }
.aspect-video { aspect-ratio: 16 / 9; }
.aspect-4-3 { aspect-ratio: 4 / 3; }
.aspect-21-9 { aspect-ratio: 21 / 9; }
.aspect-golden { aspect-ratio: 1.618 / 1; }
```

## Shadows & Elevation

Creating depth through shadows.

```css
:root {
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
}
```

## Border Radius

Consistent corner rounding.

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.125rem;  /* 2px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-2xl: 1rem;     /* 16px */
  --radius-3xl: 1.5rem;   /* 24px */
  --radius-full: 9999px;  /* Pills */
}
```

## Implementation Checklist

### Design Phase
- [ ] Define spacing requirements
- [ ] Plan responsive behavior
- [ ] Consider touch targets (44px minimum)
- [ ] Plan for content overflow
- [ ] Account for dynamic content

### Development Phase
- [ ] Use consistent spacing tokens
- [ ] Apply responsive spacing
- [ ] Test on actual devices
- [ ] Validate touch targets
- [ ] Check alignment across breakpoints

### Review Phase
- [ ] Visual consistency check
- [ ] Responsive testing complete
- [ ] Spacing feels natural
- [ ] No cramped areas
- [ ] Adequate white space

---

*Last Updated: January 2025*  
*Version: 1.0.0*