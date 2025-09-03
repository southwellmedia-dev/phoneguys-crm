# Form Patterns

> **Standardized form layouts and interaction patterns for The Phone Guys CRM**

## Form Layouts

### Single Column Form
```tsx
const SingleColumnForm = () => (
  <form className="max-w-lg mx-auto space-y-6">
    <FormSection title="Customer Information">
      <FormField>
        <Label htmlFor="name" required>Full Name</Label>
        <Input id="name" type="text" />
      </FormField>
      
      <FormField>
        <Label htmlFor="email" required>Email Address</Label>
        <Input id="email" type="email" />
        <HelperText>We'll use this to send repair updates</HelperText>
      </FormField>
      
      <FormField>
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" placeholder="(555) 123-4567" />
      </FormField>
    </FormSection>
    
    <FormActions>
      <Button type="submit" variant="primary">Submit</Button>
      <Button type="button" variant="outline">Cancel</Button>
    </FormActions>
  </form>
);
```

### Two Column Form
```tsx
const TwoColumnForm = () => (
  <form className="max-w-4xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField>
        <Label htmlFor="firstName" required>First Name</Label>
        <Input id="firstName" type="text" />
      </FormField>
      
      <FormField>
        <Label htmlFor="lastName" required>Last Name</Label>
        <Input id="lastName" type="text" />
      </FormField>
      
      <FormField>
        <Label htmlFor="email" required>Email</Label>
        <Input id="email" type="email" />
      </FormField>
      
      <FormField>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" />
      </FormField>
      
      <FormField className="md:col-span-2">
        <Label htmlFor="address">Street Address</Label>
        <Input id="address" type="text" />
      </FormField>
      
      <FormField>
        <Label htmlFor="city">City</Label>
        <Input id="city" type="text" />
      </FormField>
      
      <FormField>
        <Label htmlFor="state">State</Label>
        <Select id="state">
          <option>Select State</option>
          <option>Texas</option>
          {/* More options */}
        </Select>
      </FormField>
    </div>
    
    <FormActions className="mt-6">
      <Button type="submit" variant="primary">Save Customer</Button>
      <Button type="button" variant="outline">Cancel</Button>
    </FormActions>
  </form>
);
```

## Multi-Step Forms

### Step Indicator
```tsx
const StepIndicator = ({ steps, currentStep }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-medium
              ${index < currentStep 
                ? 'bg-green-500 text-white' 
                : index === currentStep
                ? 'bg-brand-cyan-500 text-white'
                : 'bg-gray-200 text-gray-500'
              }
            `}>
              {index < currentStep ? <CheckIcon /> : index + 1}
            </div>
            <span className="text-xs mt-2 text-center">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${
              index < currentStep ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);
```

### Multi-Step Form Container
```tsx
const MultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  
  const steps = [
    { id: 'device', label: 'Device Info' },
    { id: 'issues', label: 'Issues' },
    { id: 'customer', label: 'Customer' },
    { id: 'review', label: 'Review' }
  ];
  
  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator steps={steps} currentStep={currentStep} />
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {currentStep === 0 && (
          <DeviceInfoStep 
            data={formData.device}
            onNext={(data) => {
              setFormData({ ...formData, device: data });
              setCurrentStep(1);
            }}
          />
        )}
        
        {currentStep === 1 && (
          <IssuesStep
            data={formData.issues}
            onNext={(data) => {
              setFormData({ ...formData, issues: data });
              setCurrentStep(2);
            }}
            onBack={() => setCurrentStep(0)}
          />
        )}
        
        {/* More steps */}
      </div>
    </div>
  );
};
```

## Form Validation Patterns

### Inline Validation
```tsx
const InlineValidationField = () => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  
  const validate = (val) => {
    if (!val) return 'This field is required';
    if (!val.includes('@')) return 'Please enter a valid email';
    return '';
  };
  
  const handleBlur = () => {
    setTouched(true);
    setError(validate(value));
  };
  
  const handleChange = (e) => {
    setValue(e.target.value);
    if (touched) {
      setError(validate(e.target.value));
    }
  };
  
  return (
    <FormField>
      <Label htmlFor="email" required>Email</Label>
      <Input
        id="email"
        type="email"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched && error}
        className={touched && error ? 'border-red-500' : ''}
      />
      {touched && error && (
        <ErrorMessage>{error}</ErrorMessage>
      )}
    </FormField>
  );
};
```

### Form-Level Validation
```tsx
const ValidatedForm = () => {
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email';
    return newErrors;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      // Submit form
    } else {
      setErrors(newErrors);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <FormField>
        <Label htmlFor="name" required>Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
        />
        {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
      </FormField>
      
      {/* More fields */}
      
      <Button type="submit">Submit</Button>
    </form>
  );
};
```

## Input Group Patterns

### Input with Icon
```tsx
const IconInput = () => (
  <FormField>
    <Label>Search Customers</Label>
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <Input type="search" className="pl-10" placeholder="Search by name or email" />
    </div>
  </FormField>
);
```

### Input with Addon
```tsx
const AddonInput = () => (
  <FormField>
    <Label>Website</Label>
    <div className="flex">
      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
        https://
      </span>
      <Input type="text" className="rounded-l-none" placeholder="example.com" />
    </div>
  </FormField>
);
```

### Input with Button
```tsx
const InputWithButton = () => (
  <FormField>
    <Label>Promo Code</Label>
    <div className="flex">
      <Input type="text" className="rounded-r-none" placeholder="Enter code" />
      <Button className="rounded-l-none">Apply</Button>
    </div>
  </FormField>
);
```

## Select Patterns

### Searchable Select
```tsx
const SearchableSelect = ({ options, value, onChange }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-3 py-2 border rounded-md"
      >
        {value ? options.find(o => o.value === value)?.label : 'Select...'}
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
          <Input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 border-b"
          />
          <div className="max-h-60 overflow-auto">
            {filteredOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### Multi-Select
```tsx
const MultiSelect = ({ options, selected, onChange }) => (
  <div className="space-y-2">
    {options.map(option => (
      <label key={option.value} className="flex items-center">
        <Checkbox
          checked={selected.includes(option.value)}
          onChange={(checked) => {
            if (checked) {
              onChange([...selected, option.value]);
            } else {
              onChange(selected.filter(v => v !== option.value));
            }
          }}
        />
        <span className="ml-2">{option.label}</span>
      </label>
    ))}
  </div>
);
```

## Date & Time Patterns

### Date Picker
```tsx
const DatePickerField = () => (
  <FormField>
    <Label>Appointment Date</Label>
    <div className="relative">
      <Input type="date" className="pl-10" />
      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    </div>
  </FormField>
);
```

### Date Range Picker
```tsx
const DateRangePicker = () => (
  <div className="flex items-center space-x-2">
    <FormField>
      <Label>Start Date</Label>
      <Input type="date" />
    </FormField>
    <span className="mt-6">to</span>
    <FormField>
      <Label>End Date</Label>
      <Input type="date" />
    </FormField>
  </div>
);
```

### Time Slot Selector
```tsx
const TimeSlotSelector = ({ slots, selected, onChange }) => (
  <div className="grid grid-cols-4 gap-2">
    {slots.map(slot => (
      <button
        key={slot.value}
        type="button"
        onClick={() => onChange(slot.value)}
        className={`
          px-3 py-2 rounded-md text-sm font-medium
          ${selected === slot.value
            ? 'bg-brand-cyan-500 text-white'
            : slot.available
            ? 'bg-gray-100 hover:bg-gray-200'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }
        `}
        disabled={!slot.available}
      >
        {slot.label}
      </button>
    ))}
  </div>
);
```

## File Upload Patterns

### Single File Upload
```tsx
const FileUpload = ({ accept, onChange }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    }
  };
  
  return (
    <FormField>
      <Label>Upload Photo</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        {preview ? (
          <div className="space-y-4">
            <img src={preview} alt="Preview" className="mx-auto max-h-48" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
            >
              Remove
            </Button>
          </div>
        ) : (
          <>
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-brand-cyan-500 hover:text-brand-cyan-600">
                  Upload a file
                </span>
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  accept={accept}
                  onChange={handleChange}
                />
              </label>
              <p className="text-xs text-gray-500">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG up to 10MB
            </p>
          </>
        )}
      </div>
    </FormField>
  );
};
```

### Multiple File Upload
```tsx
const MultiFileUpload = ({ files, onAdd, onRemove }) => (
  <FormField>
    <Label>Device Photos</Label>
    <div className="space-y-3">
      {files.map(file => (
        <div key={file.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex items-center">
            <FileIcon className="h-8 w-8 text-gray-400" />
            <div className="ml-3">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(file)}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
        <input
          type="file"
          className="sr-only"
          multiple
          onChange={(e) => onAdd(Array.from(e.target.files))}
        />
        <div className="text-center">
          <PlusIcon className="mx-auto h-8 w-8 text-gray-400" />
          <span className="mt-2 text-sm text-gray-600">Add more files</span>
        </div>
      </label>
    </div>
  </FormField>
);
```

## Dynamic Form Patterns

### Add/Remove Fields
```tsx
const DynamicFieldList = () => {
  const [fields, setFields] = useState([{ id: 1, value: '' }]);
  
  const addField = () => {
    setFields([...fields, { id: Date.now(), value: '' }]);
  };
  
  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };
  
  const updateField = (id, value) => {
    setFields(fields.map(f => f.id === id ? { ...f, value } : f));
  };
  
  return (
    <FormField>
      <Label>Additional Notes</Label>
      <div className="space-y-2">
        {fields.map(field => (
          <div key={field.id} className="flex space-x-2">
            <Input
              value={field.value}
              onChange={(e) => updateField(field.id, e.target.value)}
              placeholder="Enter note"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeField(field.id)}
              disabled={fields.length === 1}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addField}
        className="mt-2"
      >
        <PlusIcon className="h-4 w-4 mr-1" />
        Add Another
      </Button>
    </FormField>
  );
};
```

## Form State Patterns

### Loading State
```tsx
const FormWithLoading = ({ isSubmitting }) => (
  <form>
    <fieldset disabled={isSubmitting}>
      {/* Form fields */}
    </fieldset>
    
    <FormActions>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Spinner size="sm" className="mr-2" />
            Submitting...
          </>
        ) : (
          'Submit'
        )}
      </Button>
    </FormActions>
  </form>
);
```

### Success State
```tsx
const FormSuccess = ({ message }) => (
  <Alert variant="success">
    <CheckCircleIcon className="h-5 w-5" />
    <AlertTitle>Success!</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);
```

---

*Last Updated: January 2025*  
*Version: 1.0.0*