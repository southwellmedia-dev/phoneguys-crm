# Connected Premium Components

> **Real-time data integration** for your premium design system components

## 🎯 Overview

The connected components bridge your beautiful premium design system with real-time CRM data. These components automatically handle:

- **Real-time updates** via Supabase subscriptions
- **Business rule-based styling** (priority, colors, formatting)
- **Loading and error states** with graceful fallbacks
- **Optimistic updates** following your established patterns

## 🚀 Quick Start

### Basic Usage

```tsx
import { 
  DashboardGrid, 
  ConnectedMetricCard,
  ConnectedStatCard 
} from '@/components/premium/connected';

// Complete dashboard with automatic real-time updates
function Dashboard() {
  return <DashboardGrid layout="default" />;
}

// Individual connected components
function CustomMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ConnectedMetricCard
        metric="revenue"
        icon={DollarSign}
        priority="high"
      />
      <ConnectedStatCard
        metric="pending"
        variant="gradient-border"
        color="amber"
      />
      <ConnectedMetricCard
        metric="completed_today"
        priority="medium"
      />
    </div>
  );
}
```

### Ticket Detail Pages

```tsx
import { 
  ConnectedPhoneDetailCard,
  ConnectedActivityTimeline 
} from '@/components/premium/connected';

function TicketDetailPage({ ticketId }: { ticketId: string }) {
  return (
    <div className="space-y-6">
      <ConnectedPhoneDetailCard ticketId={ticketId} />
      <ConnectedActivityTimeline 
        ticketId={ticketId}
        variant="detailed"
        maxEvents={10}
      />
    </div>
  );
}
```

## 📦 Available Components

### Dashboard Components

#### `ConnectedMetricCard`
Connects `MetricCard` with real-time dashboard data:

```tsx
<ConnectedMetricCard
  metric="revenue"           // Required: which metric to display
  icon={DollarSign}          // Optional: icon override
  priority="high"            // Optional: visual hierarchy
  variant="solid"            // Optional: variant override
  color="green"              // Optional: color override
  formatValue={(v) => `$${v}`} // Optional: custom formatting
/>
```

**Available Metrics:**
- `revenue` - Daily/total revenue
- `orders` - Total orders
- `pending` - Pending orders
- `repair_time` - Average repair time
- `completed_today` - Daily completions
- `average_value` - Average order value
- `customer_satisfaction` - Satisfaction percentage

#### `ConnectedStatCard`
Connects `StatCard` with creative variants:

```tsx
<ConnectedStatCard
  metric="pending"
  variant="background-number"  // Creative visual variants
  color="amber"
  showChange={true}           // Show trend data
/>
```

**Available Variants:**
- `default` - Standard card
- `background-number` - Large faded number background
- `gradient-border` - Gradient border accent
- `floating` - Hover lift effect
- `split` - Vertical color bar

#### `DashboardGrid`
Pre-configured layout with multiple connected components:

```tsx
<DashboardGrid
  layout="default"        // "default" | "compact" | "expanded"
  showAllMetrics={false}  // Show extended metrics set
  className="custom-grid"
/>
```

### Business Components

#### `ConnectedPhoneDetailCard`
Connects `PhoneDetailCard` with repair ticket data:

```tsx
<ConnectedPhoneDetailCard
  ticketId="ticket-123"
  className="mb-6"
/>
```

**Automatic Features:**
- Device information from ticket
- Repair issues extraction
- Warranty status
- Loading and error states

#### `ConnectedActivityTimeline`
Connects `ActivityTimeline` with ticket events:

```tsx
<ConnectedActivityTimeline
  ticketId="ticket-123"
  variant="detailed"       // "default" | "compact" | "detailed"
  maxEvents={10}          // Limit number of events
  showCard={true}         // Wrap in card component
  title="Repair Progress" // Custom title
/>
```

**Real-time Features:**
- Auto-updates on ticket changes
- New notes appear instantly
- Timer status updates
- Status change notifications

## 🎨 Visual Hierarchy System

### Priority Levels

Components automatically determine priority based on business rules:

```tsx
// High Priority (solid, prominent)
<ConnectedMetricCard metric="revenue" />    // Auto: priority="high"
<ConnectedMetricCard metric="orders" />     // Auto: priority="high"

// Medium Priority (gradient, standard)
<ConnectedMetricCard metric="pending" />    // Auto: priority="medium"

// Low Priority (outlined, subtle)
<ConnectedMetricCard metric="repair_time" /> // Auto: priority="low"
```

### Color Rules

Colors automatically adjust based on business context:

```tsx
// Revenue metrics = green (positive)
<ConnectedMetricCard metric="revenue" />     // Auto: color="green"

// Pending items = amber (attention needed)
<ConnectedMetricCard metric="pending" />     // Auto: color="amber"

// High pending count = red (critical)
// Automatically changes based on value thresholds
```

### Custom Overrides

Override automatic behavior when needed:

```tsx
<ConnectedMetricCard
  metric="pending"
  priority="high"         // Force high priority
  color="red"            // Force red color
  variant="solid"        // Force solid variant
  title="URGENT: Pending" // Custom title
/>
```

## 🔄 Real-time Features

### Automatic Updates

All connected components automatically update when data changes:

- **Dashboard metrics** update every 30 seconds
- **Ticket data** updates instantly via Supabase realtime
- **Activity timeline** shows new events immediately
- **No manual refreshing** required

### Optimistic Updates

Following your established patterns:

```tsx
// Components handle loading states
<ConnectedMetricCard metric="revenue" /> // Shows "--" while loading

// Error states with graceful fallbacks
// Shows "Error" with retry capability on failure

// Real-time subscriptions update React Query cache directly
// No router.refresh() calls
```

## 🧪 Example Layouts

### Executive Dashboard

```tsx
function ExecutiveDashboard() {
  return (
    <div className="space-y-6">
      {/* Hero metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <ConnectedMetricCard
          metric="revenue"
          priority="high"
          variant="solid"
          color="green"
        />
        <ConnectedMetricCard
          metric="orders"
          priority="high"
          variant="solid"
          color="cyan"
        />
      </div>
      
      {/* Supporting metrics with visual variety */}
      <div className="grid gap-4 md:grid-cols-3">
        <ConnectedStatCard
          metric="pending"
          variant="gradient-border"
          color="amber"
        />
        <ConnectedStatCard
          metric="repair_time"
          variant="background-number"
          color="purple"
        />
        <ConnectedStatCard
          metric="customer_satisfaction"
          variant="floating"
          color="purple"
        />
      </div>
    </div>
  );
}
```

### Technician Dashboard

```tsx
function TechnicianDashboard() {
  return (
    <DashboardGrid 
      layout="compact"
      showAllMetrics={false}
    />
  );
}
```

### Ticket Detail Page

```tsx
function TicketDetail({ ticketId }: { ticketId: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <ConnectedPhoneDetailCard ticketId={ticketId} />
        <ConnectedActivityTimeline 
          ticketId={ticketId}
          variant="detailed"
        />
      </div>
      <div>
        {/* Other ticket information */}
      </div>
    </div>
  );
}
```

## 🛠️ Customization

### Custom Formatting

```tsx
<ConnectedMetricCard
  metric="repair_time"
  formatValue={(minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }}
/>
```

### Business Rule Customization

Modify `/lib/utils/metric-priority.ts` to adjust:

- Priority determination logic
- Color selection rules
- Value formatting
- Critical threshold detection

### Layout Customization

```tsx
// Custom grid layouts
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <ConnectedMetricCard metric="revenue" className="lg:col-span-2" />
  <ConnectedMetricCard metric="orders" />
  <ConnectedMetricCard metric="pending" />
</div>
```

## 🚨 Best Practices

### DO ✅

```tsx
// Use DashboardGrid for standard layouts
<DashboardGrid layout="default" />

// Mix component variants for visual interest
<ConnectedStatCard variant="gradient-border" />
<ConnectedMetricCard variant="solid" priority="high" />

// Let components handle their own data fetching
<ConnectedMetricCard metric="revenue" />

// Follow established priority hierarchy
// High -> Medium -> Low for visual flow
```

### DON'T ❌

```tsx
// Don't override real-time data with static values
<ConnectedMetricCard metric="revenue" value={1000} /> // Wrong!

// Don't make everything high priority
<ConnectedMetricCard priority="high" />  // Use sparingly
<ConnectedMetricCard priority="high" />  // Visual hierarchy lost

// Don't bypass the connected layer
<MetricCard value={staticValue} />  // Use ConnectedMetricCard instead
```

## 🔗 Integration with Existing Code

### Replace Existing Components

```tsx
// Old way
import { MetricCard } from '@/components/dashboard/metric-card';
const [revenue, setRevenue] = useState(0);

// New way
import { ConnectedMetricCard } from '@/components/premium/connected';
// No state needed - real-time data automatically handled
<ConnectedMetricCard metric="revenue" />
```

### Use with Existing Hooks

```tsx
// Still works alongside existing patterns
function CustomDashboard() {
  const { data: customData } = useCustomHook();
  
  return (
    <div className="space-y-6">
      <DashboardGrid />  {/* Automatic data */}
      {customData && <CustomComponent data={customData} />}
    </div>
  );
}
```

## 📊 Performance

- **Efficient subscriptions**: Only subscribes to needed data
- **Smart caching**: Leverages React Query cache
- **Optimized rendering**: Components only re-render when their specific data changes
- **Lazy loading**: Components handle their own loading states

## 🆘 Troubleshooting

### Component Not Updating
- Check that React Query is properly configured
- Verify Supabase realtime connection
- Ensure correct `ticketId` or `metric` prop

### Data Not Loading
- Check network connection
- Verify API endpoints are working
- Look for console errors in browser dev tools

### Styling Issues
- Ensure Tailwind classes are available
- Check for CSS conflicts
- Verify component variant spelling

---

## 🎯 Next Steps

1. **Replace existing static components** with connected versions
2. **Implement custom metrics** using the established patterns
3. **Add more business-specific connected components**
4. **Extend real-time subscriptions** to additional data sources

For more details, see the main `/docs/design-ui/PREMIUM_DESIGN_SYSTEM.md` documentation.