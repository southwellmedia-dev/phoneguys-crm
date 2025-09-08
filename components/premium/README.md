# 🎨 Premium Design System Components

> **⚠️ USE THESE COMPONENTS** for all new development. These are our modern, enhanced components that follow our premium design system.

## 📁 Structure

```
/premium
  /cards         - Enhanced card components with variants
  /repair        - Business-specific repair components  
  /timeline      - Timeline and activity components
  /widgets       - Interactive widgets and selectors
  index.ts       - Barrel exports for easy imports
```

## 🚀 Quick Start

### Import Everything
```tsx
import { 
  StatCard,
  PhoneDetailCard,
  ActivityTimeline,
  RepairServiceWidget 
} from '@/components/premium';
```

### Import Specific Categories
```tsx
import { StatCard } from '@/components/premium/cards';
import { PhoneDetailCard } from '@/components/premium/repair';
import { ActivityTimeline } from '@/components/premium/timeline';
import { RepairServiceWidget } from '@/components/premium/widgets';
```

## 🎯 Component Guide

### Cards (`/premium/cards`)

#### StatCard
Modern stat cards with creative variations:
```tsx
<StatCard
  variant="background-number"  // Large bg number
  variant="gradient-border"     // Gradient accent
  variant="floating"           // Hover lift effect
  variant="split"              // Side color bar
  color="cyan|purple|green|amber|red"
  title="Revenue"
  value="$12.5K"
  change={15}
  icon={DollarSign}
/>
```

### Repair Components (`/premium/repair`)

#### PhoneDetailCard
Comprehensive device information display:
```tsx
<PhoneDetailCard
  device={{
    brand: "Apple",
    model: "iPhone 14 Pro",
    color: "Deep Purple",
    storage: "256GB",
    condition: "good"
  }}
  issues={["Screen", "Battery"]}
  warranty={{ status: "active" }}
/>
```

#### RepairServiceWidget
Interactive service selection:
```tsx
<RepairServiceWidget
  services={services}
  selectedIds={selected}
  onSelect={handleSelect}
  variant="grid|list|compact"
/>
```

### Timeline (`/premium/timeline`)

#### ActivityTimeline
Beautiful activity tracking:
```tsx
<ActivityTimeline
  events={events}
  variant="default|compact|detailed"
/>
```

## ✅ When to Use Premium Components

### ALWAYS Use Premium Components For:
- ✅ New pages and features
- ✅ Dashboard metrics and stats
- ✅ Repair/ticket detail pages
- ✅ Customer detail pages
- ✅ Any new development

### Still Use Basic UI Components For:
- ✅ Forms (use enhanced `/ui` components)
- ✅ Basic buttons and inputs (use enhanced `/ui` components)
- ✅ Modals and dialogs (use `/ui` components)

## 🎨 Visual Hierarchy Guide

### High Priority (Eye-catching)
```tsx
<StatCard variant="gradient-border" color="cyan" />
<Card variant="solid" color="cyan" />
<MetricCard priority="high" />
```

### Medium Priority (Standard)
```tsx
<StatCard variant="floating" />
<Card variant="gradient" />
<MetricCard priority="medium" />
```

### Low Priority (Subtle)
```tsx
<StatCard variant="default" />
<Card variant="outlined" />
<MetricCard priority="low" />
```

## 🔄 Migration from Old Components

### Old Dashboard Card → Premium StatCard
```tsx
// ❌ Old
<Card>
  <CardContent>
    <p>{title}</p>
    <p>{value}</p>
  </CardContent>
</Card>

// ✅ New Premium
<StatCard
  title={title}
  value={value}
  variant="floating"
  color="cyan"
/>
```

### Old Metric Display → Premium MetricCard
```tsx
// ❌ Old
<div className="metric">...</div>

// ✅ New Premium (from /dashboard)
<MetricCard
  priority="high"
  color="green"
  title="Today's Revenue"
  value="$4,280"
/>
```

## 📝 Component Status

| Component | Location | Status | Usage |
|-----------|----------|--------|-------|
| StatCard | `/premium/cards` | ✅ Ready | Dashboard, Analytics |
| PhoneDetailCard | `/premium/repair` | ✅ Ready | Device Details |
| ActivityTimeline | `/premium/timeline` | ✅ Ready | Repair Progress |
| RepairServiceWidget | `/premium/widgets` | ✅ Ready | Service Selection |
| MetricCard | `/dashboard` | ✅ Enhanced | Dashboard KPIs |

## 🚧 Coming Soon

- DataTable with sorting/filtering
- ChartCard with visualizations
- CustomerSatisfactionWidget
- TimeEntryWidget
- InvoiceComponents
- NotificationCards

## ⚠️ Important Notes

1. **Always import from `/premium` for new components**
2. **Use the Design System page (`/design-system`) to preview all components**
3. **Maintain visual hierarchy - don't make everything high priority**
4. **Mix variants for visual interest**
5. **Follow the color guidelines in the design system docs**

## 📚 Full Documentation

See `/docs/design-ui/PREMIUM_DESIGN_SYSTEM.md` for complete documentation.

---

**Remember**: If you're unsure which component to use, check the Design System showcase at `/design-system` in the app!