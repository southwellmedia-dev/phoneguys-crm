# Data Display Patterns

> **Patterns for presenting data in tables, lists, cards, and other formats**

## Data Tables

### Standard Data Table
```tsx
const OrdersTable = ({ orders, onSort, sortConfig }) => (
  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th 
            scope="col" 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => onSort('ticketNumber')}
          >
            <div className="flex items-center">
              Order #
              <SortIcon field="ticketNumber" current={sortConfig} />
            </div>
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Customer
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Device
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Priority
          </th>
          <th scope="col" className="relative px-6 py-3">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {orders.map((order, index) => (
          <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {order.ticketNumber}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{order.customerName}</div>
              <div className="text-sm text-gray-500">{order.customerEmail}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {order.deviceBrand} {order.deviceModel}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <StatusBadge status={order.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <PriorityBadge priority={order.priority} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <Button variant="ghost" size="sm">
                View
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
```

### Responsive Table
```tsx
const ResponsiveTable = ({ data, columns }) => (
  <div className="overflow-x-auto">
    {/* Desktop View */}
    <table className="hidden md:table min-w-full">
      {/* Standard table markup */}
    </table>
    
    {/* Mobile View - Cards */}
    <div className="md:hidden space-y-4">
      {data.map(item => (
        <Card key={item.id}>
          <CardContent className="p-4">
            {columns.map(column => (
              <div key={column.key} className="flex justify-between py-1">
                <span className="text-sm text-gray-500">{column.label}:</span>
                <span className="text-sm font-medium">
                  {column.render ? column.render(item) : item[column.key]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
```

### Table with Filters
```tsx
const FilterableTable = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    search: ''
  });
  
  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="w-40"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </Select>
        
        <Select
          value={filters.dateRange}
          onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
          className="w-40"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </Select>
        
        <Input
          type="search"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="w-64"
          leftIcon={<SearchIcon />}
        />
        
        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>
      
      {/* Table */}
      <OrdersTable data={filteredData} />
    </div>
  );
};
```

## List Patterns

### Simple List
```tsx
const SimpleList = ({ items }) => (
  <div className="bg-white shadow overflow-hidden rounded-lg">
    <ul className="divide-y divide-gray-200">
      {items.map(item => (
        <li key={item.id} className="px-6 py-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </div>
        </li>
      ))}
    </ul>
  </div>
);
```

### List with Actions
```tsx
const ActionList = ({ items, onEdit, onDelete }) => (
  <div className="space-y-2">
    {items.map(item => (
      <div key={item.id} className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium">{item.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              aria-label="Edit"
            >
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item)}
              aria-label="Delete"
            >
              <TrashIcon className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </div>
    ))}
  </div>
);
```

### Grouped List
```tsx
const GroupedList = ({ groups }) => (
  <div className="space-y-6">
    {Object.entries(groups).map(([groupName, items]) => (
      <div key={groupName}>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          {groupName}
        </h3>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {items.map(item => (
            <div key={item.id} className="px-4 py-3">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-gray-500">{item.details}</p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
```

## Card Grid Patterns

### Basic Card Grid
```tsx
const CardGrid = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map(item => (
      <Card key={item.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>{item.title}</CardTitle>
          <CardDescription>{item.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{item.content}</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </CardFooter>
      </Card>
    ))}
  </div>
);
```

### Masonry Grid
```tsx
const MasonryGrid = ({ items }) => (
  <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
    {items.map(item => (
      <Card key={item.id} className="break-inside-avoid mb-6">
        <CardContent className="p-4">
          {/* Variable height content */}
          {item.content}
        </CardContent>
      </Card>
    ))}
  </div>
);
```

## Metric Display Patterns

### Metric Cards
```tsx
const MetricCard = ({ label, value, change, trend, icon }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-2 flex items-center ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? <TrendUpIcon /> : <TrendDownIcon />}
              <span className="ml-1">{change}% from last period</span>
            </p>
          )}
        </div>
        <div className="text-brand-cyan-500 opacity-20">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);
```

### Metric Dashboard
```tsx
const MetricsDashboard = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <MetricCard
      label="Total Repairs"
      value="156"
      change={12}
      trend="up"
      icon={<ToolIcon className="h-12 w-12" />}
    />
    <MetricCard
      label="Completed Today"
      value="24"
      change={-5}
      trend="down"
      icon={<CheckIcon className="h-12 w-12" />}
    />
    <MetricCard
      label="Revenue"
      value="$12,456"
      change={8}
      trend="up"
      icon={<DollarIcon className="h-12 w-12" />}
    />
    <MetricCard
      label="Avg. Repair Time"
      value="2.5 hrs"
      change={-15}
      trend="up"
      icon={<ClockIcon className="h-12 w-12" />}
    />
  </div>
);
```

## Timeline Patterns

### Vertical Timeline
```tsx
const VerticalTimeline = ({ events }) => (
  <div className="relative">
    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
    {events.map((event, index) => (
      <div key={index} className="relative flex items-start mb-8">
        <div className="absolute left-5 w-6 h-6 bg-white rounded-full border-4 border-brand-cyan-500" />
        <div className="ml-14">
          <time className="text-sm text-gray-500">{event.timestamp}</time>
          <h4 className="font-medium mt-1">{event.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
        </div>
      </div>
    ))}
  </div>
);
```

### Horizontal Timeline
```tsx
const HorizontalTimeline = ({ steps, current }) => (
  <div className="flex items-center justify-between">
    {steps.map((step, index) => (
      <React.Fragment key={index}>
        <div className="flex flex-col items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${index <= current 
              ? 'bg-brand-cyan-500 text-white' 
              : 'bg-gray-200 text-gray-500'
            }
          `}>
            {index < current ? <CheckIcon /> : index + 1}
          </div>
          <span className="text-xs mt-2">{step.label}</span>
        </div>
        {index < steps.length - 1 && (
          <div className={`flex-1 h-0.5 mx-2 ${
            index < current ? 'bg-brand-cyan-500' : 'bg-gray-200'
          }`} />
        )}
      </React.Fragment>
    ))}
  </div>
);
```

## Chart Patterns

### Bar Chart Display
```tsx
const SimpleBarChart = ({ data }) => (
  <div className="space-y-2">
    {data.map(item => (
      <div key={item.label} className="flex items-center">
        <span className="text-sm w-24">{item.label}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-6 ml-2">
          <div 
            className="bg-brand-cyan-500 h-6 rounded-full flex items-center justify-end pr-2"
            style={{ width: `${item.percentage}%` }}
          >
            <span className="text-xs text-white font-medium">
              {item.value}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
);
```

### Sparkline Pattern
```tsx
const Sparkline = ({ data, height = 40 }) => (
  <svg className="w-full" height={height}>
    <polyline
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      points={generatePoints(data, height)}
    />
  </svg>
);
```

## Pagination Patterns

### Standard Pagination
```tsx
const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex items-center justify-between">
    <div className="text-sm text-gray-700">
      Showing page {currentPage} of {totalPages}
    </div>
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      {[...Array(totalPages)].map((_, i) => (
        <Button
          key={i}
          variant={currentPage === i + 1 ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onPageChange(i + 1)}
        >
          {i + 1}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  </div>
);
```

### Load More Pattern
```tsx
const LoadMore = ({ hasMore, loading, onLoadMore }) => (
  <div className="text-center py-6">
    {hasMore ? (
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={loading}
      >
        {loading ? (
          <>
            <Spinner size="sm" className="mr-2" />
            Loading...
          </>
        ) : (
          'Load More'
        )}
      </Button>
    ) : (
      <p className="text-sm text-gray-500">No more items to load</p>
    )}
  </div>
);
```

---

*Last Updated: January 2025*  
*Version: 1.0.0*