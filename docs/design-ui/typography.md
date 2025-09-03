# Typography System

> **Typography guidelines and scales for The Phone Guys CRM**

## Font Families

### Primary Font Stack
```css
--font-sans: 'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Monospace Font Stack
```css
--font-mono: 'Geist Mono', 'SF Mono', Monaco, 'Cascadia Mono', 'Roboto Mono', Consolas, 'Courier New', monospace;
```

### Font Loading Strategy
```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/geist-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/geist-bold.woff2" as="font" type="font/woff2" crossorigin>
```

## Type Scale

Based on a modular scale with a ratio of 1.250 (Major Third), optimized for both mobile and desktop viewing.

### Heading Sizes

| Level | Mobile | Desktop | Line Height | Weight | Usage |
|-------|--------|---------|-------------|--------|-------|
| Display | 36px (2.25rem) | 48px (3rem) | 1.1 | 700 (Bold) | Hero sections only |
| H1 | 30px (1.875rem) | 36px (2.25rem) | 1.2 | 700 (Bold) | Page titles |
| H2 | 24px (1.5rem) | 30px (1.875rem) | 1.3 | 600 (Semibold) | Section headers |
| H3 | 20px (1.25rem) | 24px (1.5rem) | 1.4 | 600 (Semibold) | Subsections |
| H4 | 18px (1.125rem) | 20px (1.25rem) | 1.4 | 500 (Medium) | Card titles |
| H5 | 16px (1rem) | 18px (1.125rem) | 1.5 | 500 (Medium) | Small headers |
| H6 | 14px (0.875rem) | 16px (1rem) | 1.5 | 500 (Medium) | Label headers |

### Body Text Sizes

| Size | Value | Line Height | Usage |
|------|-------|-------------|-------|
| Large | 18px (1.125rem) | 1.75 | Lead paragraphs, important text |
| Base | 16px (1rem) | 1.625 | Default body text |
| Small | 14px (0.875rem) | 1.5 | Secondary text, descriptions |
| XSmall | 12px (0.75rem) | 1.5 | Captions, labels, hints |

### CSS Implementation

```css
/* Heading Classes */
.text-display {
  font-size: 2.25rem;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.02em;
  @media (min-width: 768px) {
    font-size: 3rem;
  }
}

.text-h1 {
  font-size: 1.875rem;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.01em;
  @media (min-width: 768px) {
    font-size: 2.25rem;
  }
}

.text-h2 {
  font-size: 1.5rem;
  line-height: 1.3;
  font-weight: 600;
  @media (min-width: 768px) {
    font-size: 1.875rem;
  }
}

.text-h3 {
  font-size: 1.25rem;
  line-height: 1.4;
  font-weight: 600;
  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
}

.text-h4 {
  font-size: 1.125rem;
  line-height: 1.4;
  font-weight: 500;
  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
}

.text-h5 {
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 500;
  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
}

.text-h6 {
  font-size: 0.875rem;
  line-height: 1.5;
  font-weight: 500;
  @media (min-width: 768px) {
    font-size: 1rem;
  }
}

/* Body Classes */
.text-body-lg {
  font-size: 1.125rem;
  line-height: 1.75;
}

.text-body {
  font-size: 1rem;
  line-height: 1.625;
}

.text-body-sm {
  font-size: 0.875rem;
  line-height: 1.5;
}

.text-body-xs {
  font-size: 0.75rem;
  line-height: 1.5;
}
```

## Font Weights

| Weight | Value | Variable | Usage |
|--------|-------|----------|-------|
| Regular | 400 | --font-weight-regular | Body text, descriptions |
| Medium | 500 | --font-weight-medium | Emphasized text, small headers |
| Semibold | 600 | --font-weight-semibold | Subheadings, important labels |
| Bold | 700 | --font-weight-bold | Headings, CTAs |

## Text Styles

### Brand Voice Styles

#### 1. **Bold & Confident** (Hero/Marketing)
```css
.text-hero {
  font-size: 2.25rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.1;
}
```
Example: "FAST & RELIABLE PHONE REPAIR"

#### 2. **Professional** (Dashboard/Data)
```css
.text-professional {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.625;
  letter-spacing: normal;
}
```

#### 3. **Informative** (Help/Instructions)
```css
.text-informative {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-secondary);
}
```

#### 4. **Urgent** (Alerts/CTAs)
```css
.text-urgent {
  font-size: 1rem;
  font-weight: 600;
  color: var(--brand-red);
}
```

## Letter Spacing

| Type | Value | Usage |
|------|-------|-------|
| Tight | -0.02em | Display text, large headings |
| Normal | 0 | Body text (default) |
| Relaxed | 0.025em | Small text for readability |
| Wide | 0.05em | Uppercase text, buttons |
| Extra Wide | 0.1em | Special emphasis, labels |

## Line Heights

| Name | Value | Usage |
|------|-------|-------|
| Tight | 1.1 | Display text |
| Snug | 1.25 | Headings |
| Normal | 1.5 | Default |
| Relaxed | 1.625 | Body text |
| Loose | 1.75 | Long-form content |
| Double | 2 | Special cases only |

## Text Colors

### Semantic Text Colors
```css
/* Light Mode */
.text-primary { color: var(--gray-900); }      /* Main content */
.text-secondary { color: var(--gray-600); }    /* Supporting text */
.text-tertiary { color: var(--gray-500); }     /* Less important */
.text-disabled { color: var(--gray-400); }     /* Disabled state */
.text-inverse { color: white; }                /* On dark backgrounds */
.text-brand { color: var(--brand-cyan); }      /* Brand emphasis */
.text-accent { color: var(--brand-red); }      /* Accent/CTA */
.text-success { color: var(--green-600); }     /* Success messages */
.text-warning { color: var(--amber-600); }     /* Warnings */
.text-error { color: var(--red-600); }         /* Errors */

/* Dark Mode */
.dark .text-primary { color: var(--gray-50); }
.dark .text-secondary { color: var(--gray-300); }
.dark .text-tertiary { color: var(--gray-400); }
.dark .text-disabled { color: var(--gray-500); }
.dark .text-inverse { color: var(--gray-900); }
```

## Text Utilities

### Text Alignment
```css
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }
```

### Text Transform
```css
.uppercase { text-transform: uppercase; }
.lowercase { text-transform: lowercase; }
.capitalize { text-transform: capitalize; }
.normal-case { text-transform: none; }
```

### Text Decoration
```css
.underline { text-decoration: underline; }
.line-through { text-decoration: line-through; }
.no-underline { text-decoration: none; }
```

### Text Overflow
```css
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-ellipsis {
  text-overflow: ellipsis;
}

.text-clip {
  text-overflow: clip;
}
```

### Line Clamping
```css
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.line-clamp-2 {
  -webkit-line-clamp: 2;
}

.line-clamp-3 {
  -webkit-line-clamp: 3;
}
```

## Component Typography Patterns

### Page Headers
```tsx
<div className="page-header">
  <h1 className="text-h1 text-primary">Repair Orders</h1>
  <p className="text-body text-secondary mt-2">
    Manage and track all repair orders
  </p>
</div>
```

### Card Titles
```tsx
<div className="card">
  <h3 className="text-h4 font-semibold text-primary">
    Order #TPG0001
  </h3>
  <p className="text-body-sm text-secondary mt-1">
    iPhone 14 Pro - Screen Replacement
  </p>
</div>
```

### Data Tables
```tsx
<table>
  <thead>
    <tr>
      <th className="text-body-xs font-medium uppercase text-secondary">
        Order Number
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="text-body text-primary">
        TPG0001
      </td>
    </tr>
  </tbody>
</table>
```

### Form Labels
```tsx
<label className="text-body-sm font-medium text-primary">
  Customer Email
  <span className="text-error ml-1">*</span>
</label>
<input className="text-body" />
<span className="text-body-xs text-secondary mt-1">
  We'll use this to send repair updates
</span>
```

### Status Badges
```tsx
<span className="inline-flex items-center px-2 py-1 rounded-full text-body-xs font-medium bg-cyan-100 text-cyan-700">
  NEW
</span>
```

### Buttons
```tsx
<button className="text-body font-semibold uppercase tracking-wide">
  Start Repair
</button>
```

## Responsive Typography

### Mobile-First Approach
```css
/* Base (Mobile) */
.responsive-text {
  font-size: 1rem;
  line-height: 1.5;
}

/* Tablet (640px+) */
@media (min-width: 640px) {
  .responsive-text {
    font-size: 1.125rem;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .responsive-text {
    font-size: 1.25rem;
    line-height: 1.625;
  }
}
```

### Fluid Typography (Optional)
```css
/* Scales smoothly between min and max viewport widths */
.fluid-text {
  font-size: clamp(1rem, 2vw + 0.5rem, 1.5rem);
}
```

## Accessibility Guidelines

### Readability
- Minimum font size: 14px for body text
- Line length: 45-75 characters for optimal reading
- Paragraph spacing: At least 1.5x line height
- Avoid justified text on narrow screens

### Contrast Requirements
- Normal text: 4.5:1 minimum contrast
- Large text (18px+ or 14px+ bold): 3:1 minimum
- Always test with real content

### Screen Reader Considerations
- Use semantic HTML (h1-h6 for headings)
- Don't skip heading levels
- Use proper label associations
- Include visually hidden text when needed

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Implementation in Tailwind

### Extend Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    fontFamily: {
      'sans': ['Geist', 'system-ui', 'sans-serif'],
      'mono': ['Geist Mono', 'Monaco', 'monospace'],
    },
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1.5' }],
      'sm': ['0.875rem', { lineHeight: '1.5' }],
      'base': ['1rem', { lineHeight: '1.625' }],
      'lg': ['1.125rem', { lineHeight: '1.75' }],
      'xl': ['1.25rem', { lineHeight: '1.4' }],
      '2xl': ['1.5rem', { lineHeight: '1.3' }],
      '3xl': ['1.875rem', { lineHeight: '1.2' }],
      '4xl': ['2.25rem', { lineHeight: '1.1' }],
      '5xl': ['3rem', { lineHeight: '1.1' }],
    },
    letterSpacing: {
      'tighter': '-0.02em',
      'tight': '-0.01em',
      'normal': '0',
      'relaxed': '0.025em',
      'wide': '0.05em',
      'wider': '0.1em',
    },
  },
};
```

## Typography Checklist

### Before Implementation
- [ ] Font files optimized and preloaded
- [ ] Fallback fonts defined
- [ ] Type scale tested on mobile
- [ ] Line heights comfortable for reading
- [ ] Contrast ratios meet WCAG standards

### During Development
- [ ] Using semantic HTML elements
- [ ] Applying consistent text styles
- [ ] Testing responsive sizing
- [ ] Checking text overflow handling
- [ ] Validating dark mode contrast

### After Implementation
- [ ] Typography renders consistently across browsers
- [ ] No FOUT (Flash of Unstyled Text)
- [ ] Readable on all screen sizes
- [ ] Accessible to screen readers
- [ ] Performance metrics acceptable

---

*Last Updated: January 2025*  
*Version: 1.0.0*