import { z } from "zod";

// Customer validation schemas
export const customerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(
    /^[\d\s\-\(\)\+]+$/,
    "Phone number can only contain digits, spaces, dashes, parentheses and plus sign"
  ).min(10, "Phone number must be at least 10 digits"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;

// Repair ticket validation schemas
export const deviceBrands = [
  "Apple",
  "Samsung", 
  "Google",
  "OnePlus",
  "Motorola",
  "LG",
  "Nokia",
  "Sony",
  "Huawei",
  "Xiaomi",
  "Other"
] as const;

export const issueTypes = [
  "screen_crack",
  "battery_issue",
  "charging_port",
  "water_damage",
  "software_issue",
  "speaker_issue",
  "microphone_issue",
  "camera_issue",
  "button_issue",
  "other"
] as const;

export const priorityLevels = ["low", "medium", "high", "urgent"] as const;

export const repairTicketFormSchema = z.object({
  // Customer information - either existing or new
  customer_id: z.string().uuid().optional(),
  new_customer: customerFormSchema.optional(),
  
  // Device information
  device_model_id: z.string().uuid().optional(),
  device_brand: z.string().optional(), // Allow any string for now since we're using database values
  device_model: z.string().optional(),
  serial_number: z.string().optional(),
  imei: z.string().optional(),
  
  // Repair information
  issue_type: z.array(z.enum(issueTypes)).min(1, "Please select at least one issue"),
  issue_description: z.string().min(10, "Please provide a detailed description (at least 10 characters)"),
  priority: z.enum(priorityLevels).default("medium"),
  
  // Cost estimation
  estimated_cost: z.number().min(0).optional(),
  deposit_amount: z.number().min(0).optional(),
  
  // Additional notes
  internal_notes: z.string().optional(),
}).refine(
  (data) => {
    // Check if we have either a customer_id (not undefined and not empty) or new_customer data
    const hasCustomerId = data.customer_id && data.customer_id.length > 0;
    const hasNewCustomer = data.new_customer && data.new_customer.name && data.new_customer.email;
    return hasCustomerId || hasNewCustomer;
  },
  {
    message: "Either select an existing customer or provide new customer information",
    path: ["customer_id"],
  }
);

export type RepairTicketFormData = z.infer<typeof repairTicketFormSchema>;

// User invitation schema
export const userInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "technician"], {
    errorMap: () => ({ message: "Please select a valid role" })
  }),
  send_email: z.boolean().default(true),
});

export type UserInviteData = z.infer<typeof userInviteSchema>;

// User profile update schema
export const userProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  current_password: z.string().optional(),
  new_password: z.string().min(8, "Password must be at least 8 characters").optional(),
  confirm_password: z.string().optional(),
}).refine(
  (data) => {
    if (data.new_password && !data.current_password) {
      return false;
    }
    return true;
  },
  {
    message: "Current password is required to change password",
    path: ["current_password"],
  }
).refine(
  (data) => {
    if (data.new_password && data.new_password !== data.confirm_password) {
      return false;
    }
    return true;
  },
  {
    message: "Passwords do not match",
    path: ["confirm_password"],
  }
);

export type UserProfileData = z.infer<typeof userProfileSchema>;

// First login password change schema
export const firstLoginSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  new_password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirm_password: z.string(),
}).refine(
  (data) => data.new_password === data.confirm_password,
  {
    message: "Passwords do not match",
    path: ["confirm_password"],
  }
);

export type FirstLoginData = z.infer<typeof firstLoginSchema>;

// Helper function to format issue types for display
export function formatIssueType(issue: typeof issueTypes[number]): string {
  return issue
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Helper function to format priority for display
export function formatPriority(priority: typeof priorityLevels[number]): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}