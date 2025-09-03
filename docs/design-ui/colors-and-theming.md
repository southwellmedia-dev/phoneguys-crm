# Colors & Theming

> **Complete color system and theming guidelines for The Phone Guys CRM**

## Brand Colors

### Primary Palette

#### Cyan (Primary Brand Color)
The vibrant cyan from The Phone Guys website - represents technology, trust, and innovation.

```css
--brand-cyan: #00BCD4;
--brand-cyan-rgb: 0, 188, 212;
--brand-cyan-hsl: 187, 100%, 42%;
```

**Variations:**
- `cyan-50: #E0F7FA` - Lightest tint for backgrounds
- `cyan-100: #B2EBF2` - Light tint for hover states
- `cyan-200: #80DEEA` - Soft accent
- `cyan-300: #4DD0E1` - Light variation
- `cyan-400: #26C6DA` - Slightly lighter
- `cyan-500: #00BCD4` - **Base brand color**
- `cyan-600: #00ACC1` - Slightly darker
- `cyan-700: #0097A7` - Darker for text
- `cyan-800: #00838F` - Deep cyan
- `cyan-900: #006064` - Darkest shade

#### Red/Coral (Accent Color)
The energetic red from CTAs - represents urgency, action, and importance.

```css
--brand-red: #FF3B4A;
--brand-red-rgb: 255, 59, 74;
--brand-red-hsl: 354, 100%, 62%;
```

**Variations:**
- `red-50: #FFEBEE` - Lightest tint
- `red-100: #FFCDD2` - Light error backgrounds
- `red-200: #FF9BA3` - Soft warning
- `red-300: #FF6B75` - Light variation
- `red-400: #FF535F` - Slightly lighter
- `red-500: #FF3B4A` - **Base accent color**
- `red-600: #E63946` - Slightly darker
- `red-700: #CC323F` - Darker for text
- `red-800: #B32B38` - Deep red
- `red-900: #991F2B` - Darkest shade

#### Navy (Dark Sections)
The professional navy for headers and high-contrast areas.

```css
--brand-navy: #1A2B3C;
--brand-navy-rgb: 26, 43, 60;
--brand-navy-hsl: 210, 40%, 17%;
```

**Variations:**
- `navy-50: #E8EAED` - Lightest tint
- `navy-100: #C5CAD1` - Light gray-blue
- `navy-200: #9FA7B1` - Medium light
- `navy-300: #798491` - Medium
- `navy-400: #5C6B7A` - Medium dark
- `navy-500: #3F5263` - Dark
- `navy-600: #2D3E50` - Darker
- `navy-700: #1A2B3C` - **Base navy color**
- `navy-800: #14212E` - Very dark
- `navy-900: #0D1620` - Darkest shade

## Semantic Colors

### Status Colors

These colors communicate system states and user feedback.

#### Success
```css
--color-success: #10B981;
--color-success-light: #34D399;
--color-success-dark: #059669;
--color-success-bg: #D1FAE5;
--color-success-border: #6EE7B7;
```

#### Warning
```css
--color-warning: #F59E0B;
--color-warning-light: #FBB F24;
--color-warning-dark: #D97706;
--color-warning-bg: #FEF3C7;
--color-warning-border: #FCD34D;
```

#### Error
```css
--color-error: #EF4444;
--color-error-light: #F87171;
--color-error-dark: #DC2626;
--color-error-bg: #FEE2E2;
--color-error-border: #FCA5A5;
```

#### Info
```css
--color-info: #3B82F6;
--color-info-light: #60A5FA;
--color-info-dark: #2563EB;
--color-info-bg: #DBEAFE;
--color-info-border: #93BBFC;
```

### Repair Status Colors

Specific colors for repair ticket statuses, maintaining consistency with brand identity.

```css
--status-new: #00BCD4;        /* Cyan - Fresh, ready for action */
--status-in-progress: #F59E0B; /* Amber - Active work */
--status-on-hold: #6B7280;     /* Gray - Paused, waiting */
--status-completed: #10B981;   /* Green - Successfully done */
--status-cancelled: #EF4444;   /* Red - Stopped, cancelled */
```

**Usage in Components:**
```tsx
const statusColors = {
  new: 'bg-cyan-500 text-white',
  in_progress: 'bg-amber-500 text-white',
  on_hold: 'bg-gray-500 text-white',
  completed: 'bg-green-500 text-white',
  cancelled: 'bg-red-500 text-white'
};
```

## Neutral Palette

For text, borders, and backgrounds.

```css
/* Gray Scale */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;
--gray-950: #030712;
```

### Text Colors
```css
/* Light Mode */
--text-primary: #111827;    /* gray-900 */
--text-secondary: #4B5563;  /* gray-600 */
--text-tertiary: #6B7280;   /* gray-500 */
--text-disabled: #9CA3AF;   /* gray-400 */
--text-inverse: #FFFFFF;

/* Dark Mode */
--text-primary-dark: #F9FAFB;    /* gray-50 */
--text-secondary-dark: #D1D5DB;  /* gray-300 */
--text-tertiary-dark: #9CA3AF;   /* gray-400 */
--text-disabled-dark: #6B7280;   /* gray-500 */
--text-inverse-dark: #111827;
```

### Background Colors
```css
/* Light Mode */
--bg-primary: #FFFFFF;
--bg-secondary: #F9FAFB;    /* gray-50 */
--bg-tertiary: #F3F4F6;     /* gray-100 */
--bg-elevated: #FFFFFF;
--bg-overlay: rgba(0, 0, 0, 0.5);

/* Dark Mode */
--bg-primary-dark: #111827;     /* gray-900 */
--bg-secondary-dark: #1F2937;   /* gray-800 */
--bg-tertiary-dark: #374151;    /* gray-700 */
--bg-elevated-dark: #1F2937;
--bg-overlay-dark: rgba(0, 0, 0, 0.7);
```

### Border Colors
```css
/* Light Mode */
--border-default: #E5E7EB;   /* gray-200 */
--border-light: #F3F4F6;     /* gray-100 */
--border-strong: #D1D5DB;    /* gray-300 */

/* Dark Mode */
--border-default-dark: #374151;  /* gray-700 */
--border-light-dark: #1F2937;    /* gray-800 */
--border-strong-dark: #4B5563;   /* gray-600 */
```

## Theme Configuration

### Light Theme (Default)

```css
:root {
  /* Brand */
  --primary: 187 100% 42%;        /* Cyan */
  --primary-foreground: 0 0% 100%; /* White */
  --accent: 354 100% 62%;          /* Red */
  --accent-foreground: 0 0% 100%;  /* White */
  
  /* Backgrounds */
  --background: 0 0% 100%;         /* White */
  --foreground: 0 0% 6%;           /* Near black */
  
  /* Cards & Surfaces */
  --card: 0 0% 100%;               /* White */
  --card-foreground: 0 0% 6%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 6%;
  
  /* Form Elements */
  --input: 0 0% 90%;               /* Light gray border */
  --ring: 187 100% 42%;            /* Cyan focus ring */
  
  /* Semantic */
  --success: 158 64% 42%;
  --warning: 38 92% 50%;
  --destructive: 0 84% 60%;
  --info: 217 91% 60%;
  
  /* Neutral */
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;
  --border: 0 0% 90%;
  
  /* Effects */
  --radius: 0.5rem;
}
```

### Dark Theme

```css
.dark {
  /* Brand */
  --primary: 187 100% 42%;         /* Cyan (same) */
  --primary-foreground: 0 0% 6%;   /* Dark text on cyan */
  --accent: 354 100% 62%;          /* Red (same) */
  --accent-foreground: 0 0% 100%;  /* White */
  
  /* Backgrounds */
  --background: 210 40% 10%;       /* Navy-based dark */
  --foreground: 0 0% 95%;          /* Light gray */
  
  /* Cards & Surfaces */
  --card: 210 40% 13%;             /* Slightly elevated */
  --card-foreground: 0 0% 95%;
  --popover: 210 40% 13%;
  --popover-foreground: 0 0% 95%;
  
  /* Form Elements */
  --input: 210 40% 20%;            /* Navy border */
  --ring: 187 100% 42%;            /* Cyan focus ring */
  
  /* Semantic (adjusted for dark) */
  --success: 158 64% 52%;
  --warning: 38 92% 60%;
  --destructive: 0 84% 70%;
  --info: 217 91% 70%;
  
  /* Neutral */
  --muted: 210 40% 20%;
  --muted-foreground: 0 0% 65%;
  --border: 210 40% 20%;
}
```

## Implementation in Tailwind

### Extend Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Brand colors
        'brand-cyan': {
          50: '#E0F7FA',
          100: '#B2EBF2',
          200: '#80DEEA',
          300: '#4DD0E1',
          400: '#26C6DA',
          500: '#00BCD4',
          600: '#00ACC1',
          700: '#0097A7',
          800: '#00838F',
          900: '#006064',
        },
        'brand-red': {
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#FF9BA3',
          300: '#FF6B75',
          400: '#FF535F',
          500: '#FF3B4A',
          600: '#E63946',
          700: '#CC323F',
          800: '#B32B38',
          900: '#991F2B',
        },
        'brand-navy': {
          50: '#E8EAED',
          100: '#C5CAD1',
          200: '#9FA7B1',
          300: '#798491',
          400: '#5C6B7A',
          500: '#3F5263',
          600: '#2D3E50',
          700: '#1A2B3C',
          800: '#14212E',
          900: '#0D1620',
        },
        // Semantic colors using CSS variables
        primary: 'hsl(var(--primary))',
        accent: 'hsl(var(--accent))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        destructive: 'hsl(var(--destructive))',
        info: 'hsl(var(--info))',
      },
    },
  },
};
```

## Usage Guidelines

### Do's ✅

1. **Use semantic colors for their intended purpose**
   - Success for positive outcomes
   - Warning for caution states
   - Error for failures and problems
   - Info for neutral information

2. **Maintain contrast ratios**
   - Text on brand cyan: Use white (AAA compliant)
   - Text on light backgrounds: Use gray-900
   - Interactive elements: Minimum 3:1 ratio

3. **Use consistent color mapping**
   - Primary actions: Cyan
   - Dangerous actions: Red
   - Neutral actions: Gray
   - Success states: Green

4. **Apply hover/focus states consistently**
   - Hover: Darken by 10%
   - Focus: Add focus ring with primary color
   - Active: Darken by 20%

### Don'ts ❌

1. **Don't use brand colors for semantic meanings**
   - Don't use cyan for success (use green)
   - Don't use red brand color for all errors

2. **Don't create new colors without design system approval**
   - Use the existing palette
   - Request additions through proper channels

3. **Don't use low contrast combinations**
   - Cyan on white needs borders
   - Light gray on white is too subtle

4. **Don't mix theme contexts**
   - Keep light/dark mode colors separate
   - Don't hard-code colors in components

## Color Application Examples

### Buttons
```tsx
// Primary Button (Cyan)
<Button className="bg-brand-cyan-500 hover:bg-brand-cyan-600 text-white">
  Start Repair
</Button>

// Danger Button (Red)
<Button className="bg-brand-red-500 hover:bg-brand-red-600 text-white">
  Cancel Order
</Button>

// Secondary Button (Gray)
<Button className="bg-gray-200 hover:bg-gray-300 text-gray-900">
  Save Draft
</Button>
```

### Status Badges
```tsx
// Status badge mapping
const statusStyles = {
  new: 'bg-brand-cyan-100 text-brand-cyan-700 border-brand-cyan-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  on_hold: 'bg-gray-100 text-gray-700 border-gray-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};
```

### Cards
```tsx
// Light mode card
<Card className="bg-white border-gray-200 shadow-sm">
  {/* Content */}
</Card>

// Dark mode card
<Card className="dark:bg-gray-800 dark:border-gray-700">
  {/* Content */}
</Card>
```

## Accessibility Considerations

### Color Contrast Requirements

| Element Type | Minimum Ratio | Example |
|-------------|---------------|---------|
| Normal Text | 4.5:1 | Gray-700 on white |
| Large Text | 3:1 | Cyan-500 on white (with 24px+) |
| Interactive | 3:1 | Cyan-500 background |
| Disabled | No requirement | Gray-400 on gray-100 |

### Color Blind Considerations
- Never use color alone to convey meaning
- Add icons to status indicators
- Include text labels with color codes
- Test with color blind simulators

### Tools for Testing
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Stark (Figma Plugin)](https://www.getstark.co/)
- Chrome DevTools Color Picker
- [Colorblinding Chrome Extension](https://chrome.google.com/webstore/detail/colorblinding/dgbgleaofjainknadoffbjkclicbbgaa)

---

*Last Updated: January 2025*  
*Version: 1.0.0*