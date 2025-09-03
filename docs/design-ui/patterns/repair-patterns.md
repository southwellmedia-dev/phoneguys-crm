# Repair-Specific UI Patterns

> **Design patterns specific to The Phone Guys repair management workflows**

## Repair Status Workflow

### Visual Status Indicator
```tsx
const RepairStatusFlow = ({ currentStatus }) => {
  const statuses = [
    { key: 'new', label: 'New', icon: <InboxIcon /> },
    { key: 'in_progress', label: 'In Progress', icon: <ToolIcon /> },
    { key: 'on_hold', label: 'On Hold', icon: <PauseIcon /> },
    { key: 'completed', label: 'Completed', icon: <CheckIcon /> }
  ];
  
  return (
    <div className="flex items-center space-x-2">
      {statuses.map((status, index) => (
        <React.Fragment key={status.key}>
          <div className={`
            flex items-center space-x-2 px-3 py-2 rounded-lg
            ${currentStatus === status.key 
              ? 'bg-brand-cyan-500 text-white' 
              : isCompleted(status.key, currentStatus)
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-400'
            }
          `}>
            {status.icon}
            <span className="font-medium">{status.label}</span>
          </div>
          {index < statuses.length - 1 && (
            <ChevronRightIcon className="text-gray-400" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
```

### Status Timeline
```tsx
const StatusTimeline = ({ history }) => (
  <div className="relative">
    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
    {history.map((event, index) => (
      <div key={index} className="relative flex items-start mb-6">
        <div className={`
          absolute left-0 w-8 h-8 rounded-full flex items-center justify-center
          ${index === 0 ? 'bg-brand-cyan-500' : 'bg-gray-300'}
        `}>
          <StatusIcon status={event.status} />
        </div>
        <div className="ml-12">
          <p className="font-medium">{getStatusLabel(event.status)}</p>
          <p className="text-sm text-gray-600">
            {event.timestamp} by {event.user}
          </p>
          {event.note && (
            <p className="text-sm mt-1">{event.note}</p>
          )}
        </div>
      </div>
    ))}
  </div>
);
```

## Timer Interface Pattern

### Repair Timer Component
```tsx
const RepairTimer = ({ ticketId, initialTime = 0 }) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="text-4xl font-mono font-bold text-gray-900">
          {formatTime(time)}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Repair Time for {ticketId}
        </p>
      </div>
      
      {/* Control Buttons */}
      <div className="flex justify-center space-x-3">
        {!isRunning ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleStart}
            leftIcon={<PlayIcon />}
          >
            Start Timer
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              size="lg"
              onClick={handlePause}
              leftIcon={<PauseIcon />}
            >
              Pause
            </Button>
            <Button
              variant="danger"
              size="lg"
              onClick={handleStop}
              leftIcon={<StopIcon />}
            >
              Stop & Save
            </Button>
          </>
        )}
      </div>
      
      {/* Session History */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Today's Sessions
        </h4>
        <div className="space-y-2">
          {sessions.map(session => (
            <div key={session.id} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {session.startTime} - {session.endTime}
              </span>
              <span className="font-medium">
                {formatDuration(session.duration)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t flex justify-between">
          <span className="text-sm font-medium">Total Time</span>
          <span className="text-lg font-bold text-brand-cyan-600">
            {formatDuration(totalTime)}
          </span>
        </div>
      </div>
    </div>
  );
};
```

### Mini Timer Widget
```tsx
const MiniTimer = ({ ticketId, time, isRunning }) => (
  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
    <div className={`w-2 h-2 rounded-full ${
      isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
    }`} />
    <span className="font-mono text-sm font-medium">
      {formatTime(time)}
    </span>
    {isRunning ? (
      <Button size="xs" variant="ghost" onClick={handlePause}>
        <PauseIcon className="w-3 h-3" />
      </Button>
    ) : (
      <Button size="xs" variant="ghost" onClick={handleStart}>
        <PlayIcon className="w-3 h-3" />
      </Button>
    )}
  </div>
);
```

## Device Information Display

### Device Card Pattern
```tsx
const DeviceCard = ({ device }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start space-x-4">
        {/* Device Icon */}
        <div className="flex-shrink-0">
          <DeviceIcon type={device.type} className="w-12 h-12 text-gray-600" />
        </div>
        
        {/* Device Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg">
            {device.brand} {device.model}
          </h3>
          <dl className="mt-2 space-y-1">
            {device.serialNumber && (
              <div className="flex text-sm">
                <dt className="text-gray-500 w-20">Serial:</dt>
                <dd className="font-mono">{device.serialNumber}</dd>
              </div>
            )}
            {device.imei && (
              <div className="flex text-sm">
                <dt className="text-gray-500 w-20">IMEI:</dt>
                <dd className="font-mono">{device.imei}</dd>
              </div>
            )}
            <div className="flex text-sm">
              <dt className="text-gray-500 w-20">Color:</dt>
              <dd>{device.color}</dd>
            </div>
          </dl>
        </div>
        
        {/* Actions */}
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>View History</DropdownMenuItem>
              <DropdownMenuItem>Check Warranty</DropdownMenuItem>
              <DropdownMenuItem>Print Label</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardContent>
  </Card>
);
```

## Repair Issues Selection

### Issue Checklist Pattern
```tsx
const RepairIssueSelector = ({ onChange, selected = [] }) => {
  const issues = [
    { 
      id: 'screen_crack',
      label: 'Cracked Screen',
      icon: <BrokenScreenIcon />,
      estimatedTime: '1-2 hours',
      basePrice: 150
    },
    {
      id: 'battery_issue',
      label: 'Battery Replacement',
      icon: <BatteryIcon />,
      estimatedTime: '30-45 min',
      basePrice: 80
    },
    {
      id: 'charging_port',
      label: 'Charging Port',
      icon: <ChargingIcon />,
      estimatedTime: '45-60 min',
      basePrice: 95
    },
    {
      id: 'water_damage',
      label: 'Water Damage',
      icon: <WaterIcon />,
      estimatedTime: '2-3 days',
      basePrice: 200
    },
    {
      id: 'camera_issue',
      label: 'Camera Repair',
      icon: <CameraIcon />,
      estimatedTime: '1 hour',
      basePrice: 120
    }
  ];
  
  return (
    <div className="space-y-3">
      {issues.map(issue => (
        <label
          key={issue.id}
          className={`
            flex items-center p-4 border rounded-lg cursor-pointer transition
            ${selected.includes(issue.id)
              ? 'border-brand-cyan-500 bg-cyan-50'
              : 'border-gray-200 hover:bg-gray-50'
            }
          `}
        >
          <Checkbox
            checked={selected.includes(issue.id)}
            onChange={() => handleToggle(issue.id)}
          />
          <div className="ml-3 flex-1">
            <div className="flex items-center">
              {issue.icon}
              <span className="ml-2 font-medium">{issue.label}</span>
            </div>
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 mr-1" />
              <span>{issue.estimatedTime}</span>
              <span className="mx-2">•</span>
              <span>Starting at ${issue.basePrice}</span>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
};
```

## Priority Indicators

### Priority Badge System
```tsx
const PriorityIndicator = ({ priority }) => {
  const config = {
    urgent: {
      color: 'red',
      icon: <ExclamationIcon />,
      label: 'URGENT',
      description: 'Same day service'
    },
    high: {
      color: 'orange',
      icon: <ArrowUpIcon />,
      label: 'HIGH',
      description: 'Next day service'
    },
    medium: {
      color: 'blue',
      icon: <MinusIcon />,
      label: 'MEDIUM',
      description: '2-3 days'
    },
    low: {
      color: 'gray',
      icon: <ArrowDownIcon />,
      label: 'LOW',
      description: 'When available'
    }
  };
  
  const { color, icon, label, description } = config[priority];
  
  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full
      bg-${color}-100 text-${color}-700 border border-${color}-200`}>
      {icon}
      <span className="font-semibold text-xs">{label}</span>
      <Tooltip content={description}>
        <InfoIcon className="w-3 h-3" />
      </Tooltip>
    </div>
  );
};
```

## Customer Quick Actions

### Action Bar Pattern
```tsx
const CustomerQuickActions = ({ customer }) => (
  <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
    <Button
      variant="outline"
      size="sm"
      leftIcon={<PhoneIcon />}
      onClick={() => handleCall(customer.phone)}
    >
      Call
    </Button>
    <Button
      variant="outline"
      size="sm"
      leftIcon={<MessageIcon />}
      onClick={() => handleSMS(customer.phone)}
    >
      SMS
    </Button>
    <Button
      variant="outline"
      size="sm"
      leftIcon={<EmailIcon />}
      onClick={() => handleEmail(customer.email)}
    >
      Email
    </Button>
    <div className="flex-1" />
    <Button
      variant="ghost"
      size="sm"
      leftIcon={<HistoryIcon />}
      onClick={() => viewHistory(customer.id)}
    >
      View History ({customer.totalRepairs})
    </Button>
  </div>
);
```

## Repair Cost Estimation

### Cost Breakdown Display
```tsx
const RepairCostBreakdown = ({ items, tax = 0.0825 }) => {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const taxAmount = subtotal * tax;
  const total = subtotal + taxAmount;
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold mb-3">Cost Estimate</h3>
      
      {/* Line Items */}
      <div className="space-y-2 mb-3">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-600">{item.description}</span>
            <span className="font-medium">${item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      {/* Divider */}
      <div className="border-t pt-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax ({(tax * 100).toFixed(2)}%)</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Total */}
      <div className="border-t mt-3 pt-3">
        <div className="flex justify-between">
          <span className="font-semibold">Total Estimate</span>
          <span className="text-xl font-bold text-brand-cyan-600">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        * Final price may vary based on actual repair requirements
      </p>
    </div>
  );
};
```

## Notification Preferences

### Email/SMS Toggle Pattern
```tsx
const NotificationPreferences = ({ preferences, onChange }) => (
  <Card>
    <CardHeader>
      <CardTitle>Notification Preferences</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Repair Updates</p>
            <p className="text-sm text-gray-600">
              Get notified when repair status changes
            </p>
          </div>
          <div className="flex space-x-2">
            <Toggle
              label="Email"
              checked={preferences.repairUpdates.email}
              onChange={(checked) => onChange('repairUpdates.email', checked)}
            />
            <Toggle
              label="SMS"
              checked={preferences.repairUpdates.sms}
              onChange={(checked) => onChange('repairUpdates.sms', checked)}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Completion Notice</p>
            <p className="text-sm text-gray-600">
              Alert when repair is ready for pickup
            </p>
          </div>
          <div className="flex space-x-2">
            <Toggle
              label="Email"
              checked={preferences.completion.email}
              onChange={(checked) => onChange('completion.email', checked)}
            />
            <Toggle
              label="SMS"
              checked={preferences.completion.sms}
              onChange={(checked) => onChange('completion.sms', checked)}
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
```

## Search Patterns

### Ticket Search Interface
```tsx
const TicketSearchBar = ({ onSearch }) => (
  <div className="relative">
    <Input
      type="search"
      placeholder="Search by ticket #, customer, device..."
      className="pl-10 pr-20"
      onChange={handleSearch}
    />
    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
      <Button size="sm" variant="ghost">
        <FilterIcon className="mr-1" />
        Filters
      </Button>
    </div>
  </div>
);
```

---

*Last Updated: January 2025*  
*Version: 1.0.0*