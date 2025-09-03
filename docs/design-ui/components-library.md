# Component Library

> **Comprehensive component specifications and guidelines for The Phone Guys CRM**

## Component Categories

### 1. Primitives (Atoms)
Basic building blocks that cannot be broken down further.

### 2. Base Components (Molecules)
Simple components built from primitives.

### 3. Composite Components (Organisms)
Complex components combining multiple base components.

### 4. Templates
Page-level layout patterns.

## Button Component

### Variants

#### Primary (Cyan)
```tsx
<Button variant="primary">
  Start Repair
</Button>
```
- Background: `brand-cyan-500`
- Hover: `brand-cyan-600`
- Text: White
- Usage: Primary actions, CTAs

#### Secondary (Gray)
```tsx
<Button variant="secondary">
  Save Draft
</Button>
```
- Background: `gray-200`
- Hover: `gray-300`
- Text: `gray-900`
- Usage: Secondary actions

#### Danger (Red)
```tsx
<Button variant="danger">
  Cancel Order
</Button>
```
- Background: `brand-red-500`
- Hover: `brand-red-600`
- Text: White
- Usage: Destructive actions

#### Outline
```tsx
<Button variant="outline">
  View Details
</Button>
```
- Border: Current variant color
- Background: Transparent
- Hover: Light background tint

#### Ghost
```tsx
<Button variant="ghost">
  Learn More
</Button>
```
- No border or background
- Hover: Light background
- Usage: Tertiary actions

### Sizes
```tsx
<Button size="sm">Small</Button>   // 32px height
<Button size="md">Medium</Button>  // 44px height (default)
<Button size="lg">Large</Button>   // 56px height
```

### States
```tsx
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>
<Button fullWidth>Full Width</Button>
```

### Icon Buttons
```tsx
<Button leftIcon={<PhoneIcon />}>
  Call Customer
</Button>

<Button rightIcon={<ArrowRightIcon />}>
  Next Step
</Button>

<Button variant="icon" aria-label="Settings">
  <SettingsIcon />
</Button>
```

## Badge Component

### Status Badges
```tsx
const StatusBadge = ({ status }) => {
  const styles = {
    new: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
    on_hold: 'bg-gray-100 text-gray-700 border-gray-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };
  
  return (
    <span className={`badge ${styles[status]}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};
```

### Priority Badges
```tsx
<Badge priority="urgent" />  // Red with exclamation icon
<Badge priority="high" />    // Orange
<Badge priority="medium" />  // Blue
<Badge priority="low" />     // Gray
```

### Notification Badges
```tsx
<Badge count={5} />          // Number badge
<Badge dot />                // Dot indicator
<Badge count={99} max={99} /> // With maximum
```

## Card Component

### Basic Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Order #TPG0001</CardTitle>
    <CardDescription>iPhone 14 Pro</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### Card Variants
```tsx
// Elevated (with shadow)
<Card variant="elevated" />

// Outlined (border only)
<Card variant="outlined" />

// Interactive (hover effect)
<Card variant="interactive" />
```

## Form Components

### Input Field
```tsx
<FormField>
  <Label htmlFor="email" required>
    Email Address
  </Label>
  <Input
    id="email"
    type="email"
    placeholder="customer@example.com"
    error={errors.email}
  />
  <HelperText>
    We'll use this for order updates
  </HelperText>
  {errors.email && (
    <ErrorMessage>{errors.email}</ErrorMessage>
  )}
</FormField>
```

### Input Variants
```tsx
// Text Input
<Input type="text" />

// With Icon
<Input leftIcon={<SearchIcon />} />

// With Addon
<Input leftAddon="https://" />

// Textarea
<Textarea rows={4} />

// Select
<Select>
  <option>iPhone</option>
  <option>Samsung</option>
  <option>Google Pixel</option>
</Select>
```

### Checkbox & Radio
```tsx
// Checkbox
<Checkbox id="terms" label="I agree to terms" />

// Checkbox Group
<CheckboxGroup>
  <Checkbox value="screen" label="Screen Repair" />
  <Checkbox value="battery" label="Battery Replace" />
  <Checkbox value="camera" label="Camera Fix" />
</CheckboxGroup>

// Radio Group
<RadioGroup name="priority">
  <Radio value="urgent" label="Urgent (Same Day)" />
  <Radio value="normal" label="Normal (2-3 Days)" />
  <Radio value="low" label="Low (When Available)" />
</RadioGroup>
```

### Form Validation States
```tsx
// Error State
<Input error="Email is required" />

// Success State
<Input success valid />

// Warning State
<Input warning="Email might be incorrect" />

// Disabled State
<Input disabled value="Cannot edit" />
```

## Table Component

### Basic Table
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Order #</TableHead>
      <TableHead>Customer</TableHead>
      <TableHead>Device</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>TPG0001</TableCell>
      <TableCell>John Doe</TableCell>
      <TableCell>iPhone 14</TableCell>
      <TableCell>
        <StatusBadge status="in_progress" />
      </TableCell>
      <TableCell>
        <Button size="sm">View</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Table Features
```tsx
// Sortable
<TableHead sortable sortDirection="asc">
  Date
</TableHead>

// With Filters
<TableFilters>
  <Select placeholder="Status">
    {/* Options */}
  </Select>
  <DateRangePicker />
  <SearchInput />
</TableFilters>

// With Pagination
<TablePagination
  page={1}
  totalPages={10}
  onPageChange={handlePageChange}
/>

// Responsive
<Table responsive /> // Horizontal scroll on mobile
```

## Modal/Dialog Component

### Basic Modal
```tsx
<Modal open={isOpen} onClose={handleClose}>
  <ModalHeader>
    <ModalTitle>Confirm Action</ModalTitle>
  </ModalHeader>
  <ModalBody>
    Are you sure you want to cancel this repair order?
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={handleClose}>
      Cancel
    </Button>
    <Button variant="danger" onClick={handleConfirm}>
      Confirm
    </Button>
  </ModalFooter>
</Modal>
```

### Modal Sizes
```tsx
<Modal size="sm" />  // 400px max-width
<Modal size="md" />  // 600px max-width (default)
<Modal size="lg" />  // 800px max-width
<Modal size="xl" />  // 1024px max-width
<Modal size="full" /> // Full screen
```

## Navigation Components

### Sidebar Navigation
```tsx
<Sidebar>
  <SidebarHeader>
    <Logo />
  </SidebarHeader>
  <SidebarNav>
    <NavItem href="/dashboard" icon={<DashboardIcon />} active>
      Dashboard
    </NavItem>
    <NavItem href="/orders" icon={<OrdersIcon />}>
      Orders
      <Badge count={5} />
    </NavItem>
    <NavItem href="/customers" icon={<CustomersIcon />}>
      Customers
    </NavItem>
  </SidebarNav>
  <SidebarFooter>
    <UserMenu />
  </SidebarFooter>
</Sidebar>
```

### Breadcrumbs
```tsx
<Breadcrumbs>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/orders">Orders</BreadcrumbItem>
  <BreadcrumbItem current>TPG0001</BreadcrumbItem>
</Breadcrumbs>
```

### Tabs
```tsx
<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
    <TabsTrigger value="notes">Notes</TabsTrigger>
  </TabsList>
  <TabsContent value="details">
    {/* Details content */}
  </TabsContent>
  <TabsContent value="history">
    {/* History content */}
  </TabsContent>
  <TabsContent value="notes">
    {/* Notes content */}
  </TabsContent>
</Tabs>
```

## Alert & Notification Components

### Alert
```tsx
<Alert variant="info">
  <AlertIcon />
  <AlertTitle>New Feature</AlertTitle>
  <AlertDescription>
    Timer tracking is now available for all repairs.
  </AlertDescription>
</Alert>

// Variants
<Alert variant="success" />
<Alert variant="warning" />
<Alert variant="error" />
<Alert variant="info" />
```

### Toast Notifications
```tsx
// Success Toast
toast.success('Repair order created successfully!');

// Error Toast
toast.error('Failed to update status');

// Custom Toast
toast.custom((t) => (
  <div className="toast">
    <TimerIcon />
    <span>Timer started for TPG0001</span>
    <button onClick={() => toast.dismiss(t.id)}>
      Dismiss
    </button>
  </div>
));
```

## Loading States

### Spinner
```tsx
<Spinner size="sm" />  // 16px
<Spinner size="md" />  // 24px (default)
<Spinner size="lg" />  // 32px

// With Label
<Spinner label="Loading orders..." />

// Inline
<Button loading>
  <Spinner size="sm" />
  Processing...
</Button>
```

### Skeleton Loaders
```tsx
// Text Skeleton
<Skeleton className="h-4 w-32" />

// Card Skeleton
<Card>
  <Skeleton className="h-6 w-48 mb-2" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
</Card>

// Table Skeleton
<TableSkeleton rows={5} columns={4} />
```

### Progress Indicators
```tsx
// Linear Progress
<Progress value={75} />

// With Label
<Progress value={75} showLabel />

// Circular Progress
<CircularProgress value={75} />

// Step Progress
<StepProgress currentStep={2} totalSteps={4} />
```

## Timer Component (Custom)

### Repair Timer
```tsx
<RepairTimer
  ticketId="TPG0001"
  isRunning={isRunning}
  elapsedTime={elapsedTime}
  onStart={handleStart}
  onStop={handleStop}
  onPause={handlePause}
/>

// Display Format
<TimerDisplay>
  <TimerHours>02</TimerHours>
  <TimerSeparator>:</TimerSeparator>
  <TimerMinutes>45</TimerMinutes>
  <TimerSeparator>:</TimerSeparator>
  <TimerSeconds>30</TimerSeconds>
</TimerDisplay>

// Timer Controls
<TimerControls>
  <Button onClick={start} variant="primary">
    <PlayIcon /> Start
  </Button>
  <Button onClick={pause} variant="secondary">
    <PauseIcon /> Pause
  </Button>
  <Button onClick={stop} variant="danger">
    <StopIcon /> Stop
  </Button>
</TimerControls>
```

## Empty States

### No Data
```tsx
<EmptyState
  icon={<InboxIcon />}
  title="No orders yet"
  description="Create your first repair order to get started"
  action={
    <Button variant="primary">
      Create Order
    </Button>
  }
/>
```

### Error States
```tsx
<ErrorState
  title="Something went wrong"
  description="We couldn't load your orders"
  action={
    <Button onClick={retry}>
      Try Again
    </Button>
  }
/>
```

## Dropdown Menu

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">
      <MoreIcon />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleEdit}>
      <EditIcon /> Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDuplicate}>
      <CopyIcon /> Duplicate
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleDelete} danger>
      <TrashIcon /> Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Tooltip

```tsx
<Tooltip>
  <TooltipTrigger>
    <InfoIcon />
  </TooltipTrigger>
  <TooltipContent>
    This repair is currently on hold waiting for parts
  </TooltipContent>
</Tooltip>
```

## Avatar

```tsx
// With Image
<Avatar>
  <AvatarImage src="/user.jpg" alt="John Doe" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// Sizes
<Avatar size="xs" />  // 24px
<Avatar size="sm" />  // 32px
<Avatar size="md" />  // 40px (default)
<Avatar size="lg" />  // 48px
<Avatar size="xl" />  // 64px

// Status Indicator
<Avatar status="online" />
<Avatar status="offline" />
<Avatar status="busy" />
```

## Component Composition Examples

### Order Card Composition
```tsx
const OrderCard = ({ order }) => (
  <Card variant="interactive">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle>{order.ticketNumber}</CardTitle>
          <CardDescription>{order.device}</CardDescription>
        </div>
        <StatusBadge status={order.status} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <UserIcon className="mr-2" />
          <span>{order.customerName}</span>
        </div>
        <div className="flex items-center text-sm">
          <ClockIcon className="mr-2" />
          <span>{order.estimatedTime}</span>
        </div>
      </div>
    </CardContent>
    <CardFooter className="flex justify-between">
      <TimerButton orderId={order.id} />
      <Button variant="outline" size="sm">
        View Details
      </Button>
    </CardFooter>
  </Card>
);
```

### Dashboard Widget Composition
```tsx
const MetricWidget = ({ title, value, change, icon }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change && (
            <p className="text-sm text-green-600">
              +{change}% from last week
            </p>
          )}
        </div>
        <div className="text-brand-cyan-500">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);
```

## Accessibility Requirements

All components must meet WCAG 2.1 AA standards:

1. **Keyboard Navigation**
   - All interactive elements keyboard accessible
   - Visible focus indicators
   - Logical tab order

2. **Screen Reader Support**
   - Proper ARIA labels
   - Role attributes
   - Live regions for dynamic content

3. **Color Contrast**
   - 4.5:1 for normal text
   - 3:1 for large text
   - Don't rely on color alone

4. **Touch Targets**
   - Minimum 44x44px on mobile
   - Adequate spacing between targets

## Component Development Guidelines

1. **Use TypeScript** for all components
2. **Include prop types** and documentation
3. **Support dark mode** by default
4. **Make components composable** and flexible
5. **Write unit tests** for logic
6. **Include Storybook stories** for visual testing
7. **Optimize for performance** (memo, lazy loading)
8. **Follow naming conventions** consistently

---

*Last Updated: January 2025*  
*Version: 1.0.0*