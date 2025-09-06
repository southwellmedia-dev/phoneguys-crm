import { getRepository } from '@/lib/repositories/repository-manager';
import { 
  RepairTicket, 
  Customer,
  CreateRepairTicketDto, 
  UpdateRepairTicketDto,
  TicketStatus,
  CreateTicketNoteDto,
  CreateNotificationDto
} from '@/lib/types';

export class RepairOrderService {
  private useServiceRole: boolean;

  constructor(useServiceRole = false) {
    // Store the service role flag for repository access
    this.useServiceRole = useServiceRole;
  }

  // Lazy load repositories using singleton manager
  private get ticketRepo() {
    return getRepository.tickets(this.useServiceRole);
  }

  private get customerRepo() {
    return getRepository.customers(this.useServiceRole);
  }

  private get noteRepo() {
    return getRepository.notes(this.useServiceRole);
  }

  private get timeRepo() {
    // Note: TimeEntryRepository not in getRepository helper yet
    // You may want to add it to the repository manager
    const { TimeEntryRepository } = require('@/lib/repositories');
    const { RepositoryManager } = require('@/lib/repositories/repository-manager');
    return RepositoryManager.get(TimeEntryRepository, this.useServiceRole);
  }

  private get notificationRepo() {
    // Note: NotificationRepository not in getRepository helper yet
    const { NotificationRepository } = require('@/lib/repositories');
    const { RepositoryManager } = require('@/lib/repositories/repository-manager');
    return RepositoryManager.get(NotificationRepository, this.useServiceRole);
  }

  private get userRepo() {
    return getRepository.users(this.useServiceRole);
  }

  async createRepairOrder(data: CreateRepairTicketDto): Promise<RepairTicket> {
    try {
      // Handle customer creation or lookup
      let customerId: string;
      
      if ('id' in data.customer) {
        // Existing customer
        customerId = data.customer.id;
      } else {
        // New customer - check if exists first
        let customer = await this.customerRepo.findByEmail(data.customer.email);
        
        if (!customer) {
          // Create new customer
          customer = await this.customerRepo.createCustomer({
            name: data.customer.name,
            email: data.customer.email,
            phone: data.customer.phone,
            address: data.customer.address
          });
        }
        
        customerId = customer.id;
      }

      // Create the repair ticket
      const ticketData = {
        customer_id: customerId,
        device_brand: data.device.brand,
        device_model: data.device.model,
        serial_number: data.device.serial_number,
        imei: data.device.imei,
        repair_issues: data.repair_issues,
        description: data.description,
        priority: data.priority || 'medium',
        estimated_cost: data.estimated_cost,
        status: 'new' as TicketStatus,
        date_received: new Date().toISOString()
      };

      const ticket = await this.ticketRepo.create(ticketData);

      // Create initial note if description provided
      if (data.description) {
        await this.noteRepo.createNote({
          ticket_id: ticket.id,
          note_type: 'customer',
          content: `Initial description: ${data.description}`,
          is_important: false
        }, undefined); // No user_id for external API submissions
      }

      // Queue notification for new ticket
      await this.createNewTicketNotification(ticket, customerId);

      // Queue staff notification
      await this.createStaffNotification(ticket);

      return ticket;
    } catch (error) {
      console.error('Error creating repair order:', error);
      throw error;
    }
  }

  async updateRepairOrder(ticketId: string, data: UpdateRepairTicketDto, userId?: string): Promise<RepairTicket> {
    const existingTicket = await this.ticketRepo.findById(ticketId);
    if (!existingTicket) {
      throw new Error('Repair ticket not found');
    }

    // Validate status transition if status is being changed
    if (data.status && data.status !== existingTicket.status) {
      this.validateStatusTransition(existingTicket.status, data.status);
      
      // Create status change note
      await this.noteRepo.createNote({
        ticket_id: ticketId,
        note_type: 'internal',
        content: `Status changed from ${existingTicket.status} to ${data.status}`,
        is_important: true
      }, userId);

      // Send status update notification
      await this.createStatusUpdateNotification(existingTicket, data.status);
    }

    // Update the ticket
    const updatedTicket = await this.ticketRepo.update(ticketId, data);

    return updatedTicket;
  }

  async assignTicket(ticketId: string, technicianId: string | null): Promise<RepairTicket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) {
      throw new Error('Repair ticket not found');
    }

    // Verify technician exists and has correct role
    if (technicianId) {
      const technician = await this.userRepo.findById(technicianId);
      if (!technician) {
        throw new Error('Technician not found');
      }
      if (!['technician', 'admin'].includes(technician.role)) {
        throw new Error('User does not have technician permissions');
      }
    }

    // Update assignment
    const updatedTicket = await this.ticketRepo.assignToUser(ticketId, technicianId);

    // Create assignment note
    const assignmentText = technicianId 
      ? `Ticket assigned to technician`
      : `Ticket unassigned`;
    
    await this.noteRepo.createNote({
      ticket_id: ticketId,
      note_type: 'internal',
      content: assignmentText,
      is_important: false
    });

    return updatedTicket;
  }

  async startTimer(ticketId: string, userId: string): Promise<void> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) {
      throw new Error('Repair ticket not found');
    }

    // Check if timer is already running
    const activeEntry = await this.timeRepo.findActiveEntry(ticketId);
    if (activeEntry) {
      throw new Error('Timer is already running for this ticket');
    }

    // Start timer in time_entries table
    await this.timeRepo.startTimer({
      ticket_id: ticketId,
      user_id: userId,
      start_time: new Date().toISOString(),
      description: 'Timer started'
    });

    // Update ticket with timer start time
    await this.ticketRepo.startTimer(ticketId);

    // Add note about timer start
    await this.noteRepo.createNote({
      ticket_id: ticketId,
      note_type: 'internal',
      content: 'Timer started',
      is_important: false
    }, userId);
  }

  async stopTimer(ticketId: string, userId: string): Promise<void> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) {
      throw new Error('Repair ticket not found');
    }

    // Find active timer entry
    const activeEntry = await this.timeRepo.findActiveEntry(ticketId);
    if (!activeEntry) {
      throw new Error('No active timer found for this ticket');
    }

    // Stop timer in time_entries
    const stoppedEntry = await this.timeRepo.stopTimer(activeEntry.id);

    // Update ticket timer
    await this.ticketRepo.stopTimer(ticketId);

    // Add note about timer stop
    await this.noteRepo.createNote({
      ticket_id: ticketId,
      note_type: 'internal',
      content: `Timer stopped. Duration: ${stoppedEntry.duration_minutes} minutes`,
      is_important: false
    }, userId);
  }

  async addNote(ticketId: string, note: CreateTicketNoteDto, userId?: string): Promise<void> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) {
      throw new Error('Repair ticket not found');
    }

    await this.noteRepo.createNote(note, userId);
  }

  async getTicketWithFullDetails(ticketId: string): Promise<any> {
    const ticketDetails = await this.ticketRepo.getTicketWithDetails(ticketId);
    if (!ticketDetails) {
      throw new Error('Repair ticket not found');
    }

    // Calculate total time
    const totalMinutes = await this.timeRepo.getTotalTimeByTicket(ticketId);
    
    return {
      ...ticketDetails,
      total_time_minutes: totalMinutes
    };
  }

  private validateStatusTransition(currentStatus: TicketStatus, newStatus: TicketStatus): void {
    const validTransitions: Record<TicketStatus, TicketStatus[]> = {
      'new': ['in_progress', 'cancelled'],
      'in_progress': ['on_hold', 'completed', 'cancelled'],
      'on_hold': ['in_progress', 'cancelled'],
      'completed': [], // No transitions from completed
      'cancelled': []  // No transitions from cancelled
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async createNewTicketNotification(ticket: RepairTicket, customerId: string): Promise<void> {
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) return;

    const notification: CreateNotificationDto = {
      ticket_id: ticket.id,
      notification_type: 'new_ticket',
      recipient_email: customer.email,
      subject: `Repair Request Received - ${ticket.ticket_number}`,
      content: `Dear ${customer.name},\\n\\nWe have received your repair request for your ${ticket.device_brand} ${ticket.device_model}. Your ticket number is ${ticket.ticket_number}.\\n\\nWe will begin working on your device shortly and keep you updated on the progress.\\n\\nThank you for choosing The Phone Guys!`
    };

    await this.notificationRepo.createNotification(notification);
  }

  private async createStatusUpdateNotification(ticket: RepairTicket, newStatus: TicketStatus): Promise<void> {
    const customer = await this.customerRepo.findById(ticket.customer_id);
    if (!customer) return;

    let subject = `Repair Status Update - ${ticket.ticket_number}`;
    let content = '';

    switch (newStatus) {
      case 'in_progress':
        content = `Dear ${customer.name},\\n\\nYour repair (${ticket.ticket_number}) is now in progress. Our technician has started working on your ${ticket.device_brand} ${ticket.device_model}.\\n\\nWe'll notify you once the repair is complete.`;
        break;
      case 'on_hold':
        content = `Dear ${customer.name},\\n\\nYour repair (${ticket.ticket_number}) has been placed on hold. This may be due to parts availability or additional diagnosis required.\\n\\nWe'll contact you with more information soon.`;
        break;
      case 'completed':
        subject = `Repair Completed - ${ticket.ticket_number}`;
        content = `Dear ${customer.name},\\n\\nGreat news! Your repair (${ticket.ticket_number}) has been completed. Your ${ticket.device_brand} ${ticket.device_model} is ready for pickup.\\n\\nPlease visit us at your earliest convenience to collect your device.\\n\\nThank you for choosing The Phone Guys!`;
        break;
      case 'cancelled':
        content = `Dear ${customer.name},\\n\\nYour repair (${ticket.ticket_number}) has been cancelled. If you have any questions, please contact us.`;
        break;
    }

    if (content) {
      const notification: CreateNotificationDto = {
        ticket_id: ticket.id,
        notification_type: newStatus === 'completed' ? 'completion' : newStatus === 'on_hold' ? 'on_hold' : 'status_change',
        recipient_email: customer.email,
        subject,
        content
      };

      await this.notificationRepo.createNotification(notification);
    }
  }

  private async createStaffNotification(ticket: RepairTicket): Promise<void> {
    // Get all admin users to notify
    const admins = await this.userRepo.findByRole('admin');
    
    for (const admin of admins) {
      const notification: CreateNotificationDto = {
        ticket_id: ticket.id,
        notification_type: 'new_ticket',
        recipient_email: admin.email,
        subject: `New Repair Request - ${ticket.ticket_number}`,
        content: `A new repair request has been received.\\n\\nTicket: ${ticket.ticket_number}\\nDevice: ${ticket.device_brand} ${ticket.device_model}\\nIssues: ${ticket.repair_issues.join(', ')}\\nPriority: ${ticket.priority}\\n\\nPlease review and assign to a technician.`
      };

      await this.notificationRepo.createNotification(notification);
    }
  }
}