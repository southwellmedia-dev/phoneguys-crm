# Premium Pill System

A centralized, consistent system for displaying pills/badges across the application with smart color-coding and formatting.

## Components

### `<Pill>`
Single pill/badge component with automatic styling based on type and content.

```tsx
import { Pill } from '@/components/premium/ui/pills';

// Issue pills with smart color-coding
<Pill type="issue">screen_cracked</Pill>     // Red (critical)
<Pill type="issue">battery_drain</Pill>      // Orange (power)  
<Pill type="issue">software_bug</Pill>       // Purple (software)
<Pill type="issue">wifi_issues</Pill>        // Blue (connectivity)
<Pill type="issue">speaker_broken</Pill>     // Green (audio)

// Service pills
<Pill type="service">Screen Replacement</Pill>
<Pill type="service">Battery Repair</Pill>

// Count pills
<Pill isCount>+3</Pill>
```

### `<Pills>`
Container for multiple pills with overflow handling.

```tsx
import { Pills } from '@/components/premium/ui/pills';

// Issues with automatic "+X more"
<Pills 
  items={[
    { text: 'screen_cracked', type: 'issue' },
    { text: 'battery_drain', type: 'issue' },
    { text: 'wifi_issues', type: 'issue' },
    { text: 'speaker_broken', type: 'issue' },
  ]}
  maxVisible={2}  // Shows first 2 + "+2 more"
  type="issue"
/>

// Services
<Pills 
  items={services.map(s => ({ text: s.name, type: 'service' }))}
  maxVisible={3}
  type="service" 
/>
```

## Color-Coding System

### Issue Pills
- 🔴 **Critical** (red): broken, cracked, damaged, dead
- 🟠 **Power** (orange): battery, charging, power issues
- 🟣 **Software** (purple): software, app, system, update issues  
- 🔵 **Connectivity** (blue): network, wifi, bluetooth, signal issues
- 🟢 **Audio** (green): speaker, microphone, audio, sound issues
- 🟦 **Default** (cyan): all other issues

### Service Pills
- 🔴 **Critical Repairs** (red): screen_repair, display
- 🟠 **Power Services** (orange): battery_replacement, power
- 🟣 **Software Services** (purple): software_repair, software
- 🔵 **Data Services** (blue): data_recovery, backup
- 🟢 **Maintenance** (green): cleaning, maintenance
- 🟦 **Default** (primary): all other services

## Usage Examples

### In Tables
```tsx
// Replace old badge code:
<div className="flex flex-wrap gap-1">
  {issues.map((issue, idx) => (
    <span key={idx} className="bg-cyan-100 text-cyan-700 ...">
      {issue.replace(/_/g, ' ')}
    </span>
  ))}
</div>

// With new system:
<Pills 
  items={issues.map(issue => ({ text: issue, type: 'issue' }))}
  maxVisible={2}
  type="issue"
/>
```

### Status vs Pills
- Use `StatusBadge` for status indicators (new, in_progress, completed)
- Use `Pill`/`Pills` for tags, categories, issues, services

## Automatic Features

1. **Text Formatting**: `snake_case` → `Title Case`
2. **Color Coding**: Intelligent color assignment based on content
3. **Overflow Handling**: Shows "+X more" when maxVisible is exceeded
4. **Consistent Styling**: All pills use the same base classes
5. **Dark Mode**: Automatic dark mode color variants

## Migration Guide

### Old Pattern:
```tsx
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700">
  {issue.replace(/_/g, ' ')}
</span>
```

### New Pattern:
```tsx
<Pill type="issue">{issue}</Pill>
```

### Array of Pills:
```tsx
// Old
{items.slice(0, 2).map((item, idx) => (
  <span key={idx} className="...custom-styling">
    {item.replace(/_/g, ' ')}
  </span>
))}
{items.length > 2 && (
  <span>+{items.length - 2}</span>
)}

// New
<Pills 
  items={items.map(item => ({ text: item, type: 'issue' }))}
  maxVisible={2}
/>
```

## Benefits

1. **Consistency**: All pills look and behave the same
2. **Smart Coloring**: Automatic color assignment based on content
3. **Maintenance**: Update colors in one place
4. **Performance**: No repeated inline styles
5. **Accessibility**: Consistent contrast and sizing
6. **Developer Experience**: Simple, intuitive API