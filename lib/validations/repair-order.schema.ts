import { z } from 'zod';

export const repairIssueEnum = z.enum([
  'screen_crack',
  'battery_issue',
  'charging_port',
  'water_damage',
  'software_issue',
  'other'
]);

export const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
export const statusEnum = z.enum(['new', 'in_progress', 'on_hold', 'completed', 'cancelled']);

// Schema for creating a new repair order from external API (Astro website)
export const createRepairOrderSchema = z.object({
  customer: z.union([
    z.object({
      id: z.string().uuid()
    }),
    z.object({
      name: z.string().min(1, 'Customer name is required'),
      email: z.string().email('Invalid email address'),
      phone: z.string().optional(),
      address: z.string().optional()
    })
  ]),
  device: z.object({
    brand: z.string().min(1, 'Device brand is required'),
    model: z.string().min(1, 'Device model is required'),
    serial_number: z.string().optional(),
    imei: z.string().optional()
  }),
  repair_issues: z.array(repairIssueEnum)
    .min(1, 'At least one repair issue must be selected'),
  description: z.string().optional(),
  priority: priorityEnum.default('medium'),
  estimated_cost: z.number().positive().optional()
});

// Schema for updating an existing repair order
export const updateRepairOrderSchema = z.object({
  assigned_to: z.string().uuid().optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  repair_issues: z.array(repairIssueEnum).optional(),
  description: z.string().optional(),
  estimated_cost: z.number().positive().optional(),
  actual_cost: z.number().positive().optional()
});

// Schema for adding a note to a ticket
export const createTicketNoteSchema = z.object({
  ticket_id: z.string().uuid(),
  note_type: z.enum(['internal', 'customer']),
  content: z.string().min(1, 'Note content is required'),
  is_important: z.boolean().default(false)
});

// Schema for timer operations
export const timerOperationSchema = z.object({
  ticket_id: z.string().uuid(),
  user_id: z.string().uuid()
});

// Types inferred from schemas
export type CreateRepairOrderInput = z.infer<typeof createRepairOrderSchema>;
export type UpdateRepairOrderInput = z.infer<typeof updateRepairOrderSchema>;
export type CreateTicketNoteInput = z.infer<typeof createTicketNoteSchema>;
export type TimerOperationInput = z.infer<typeof timerOperationSchema>;