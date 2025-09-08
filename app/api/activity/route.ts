import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RepairTicketRepository } from '@/lib/repositories/repair-ticket.repository';
import { CustomerRepository } from '@/lib/repositories/customer.repository';
import { AppointmentRepository } from '@/lib/repositories/appointment.repository';
import { type ActivityItem } from '@/lib/hooks/connected/use-activity-feed';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Initialize repositories with service role for full access
    const ticketRepo = new RepairTicketRepository(true);
    const customerRepo = new CustomerRepository(true);
    const appointmentRepo = new AppointmentRepository(true);

    let activities: ActivityItem[] = [];

    // Fetch different types of activities based on request
    if (type === 'all' || type === 'tickets') {
      const tickets = await ticketRepo.findAllWithCustomers();
      const recentTickets = tickets
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, type === 'tickets' ? limit : Math.floor(limit / 3));

      const ticketActivities: ActivityItem[] = recentTickets.map(ticket => ({
        id: ticket.id,
        type: 'ticket' as const,
        action: ticket.status === 'completed' ? 'completed' : 
                ticket.status === 'new' ? 'created' : 'updated',
        title: `Ticket #${ticket.ticket_number || ticket.id.slice(-6)}`,
        description: ticket.device_model ? `${ticket.device_model} repair` : 'Device repair',
        timestamp: ticket.updated_at,
        metadata: {
          customer_name: ticket.customers?.full_name || ticket.customers?.name || 'Unknown',
          ticket_number: ticket.ticket_number,
          status: ticket.status,
          device: ticket.device_model
        }
      }));

      activities.push(...ticketActivities);
    }

    if (type === 'all' || type === 'appointments') {
      const appointments = await appointmentRepo.findAllWithDetails();
      const recentAppointments = appointments
        .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
        .slice(0, type === 'appointments' ? limit : Math.floor(limit / 3));

      const appointmentActivities: ActivityItem[] = recentAppointments.map((apt: any) => ({
        id: apt.id,
        type: 'appointment' as const,
        action: apt.status === 'cancelled' ? 'cancelled' : 
                apt.status === 'completed' ? 'completed' : 'updated',
        title: `Appointment with ${apt.customers?.name || apt.customer_name || 'Customer'}`,
        description: new Date(apt.scheduled_date).toLocaleDateString(),
        timestamp: apt.updated_at || apt.created_at,
        metadata: {
          customer_name: apt.customers?.name || apt.customer_name,
          appointment_date: apt.scheduled_date,
          status: apt.status,
          services: apt.services
        }
      }));

      activities.push(...appointmentActivities);
    }

    if (type === 'all' || type === 'customers') {
      const customers = await customerRepo.findAll();
      const recentCustomers = customers
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, type === 'customers' ? limit : Math.floor(limit / 3));

      const customerActivities: ActivityItem[] = recentCustomers.map(customer => ({
        id: customer.id,
        type: 'customer' as const,
        action: 'created' as const,
        title: `Customer ${customer.full_name || customer.name || 'Unknown'}`,
        description: customer.phone ? `Phone: ${customer.phone}` : 'New customer registration',
        timestamp: customer.created_at,
        metadata: {
          customer_name: customer.full_name || customer.name,
          phone: customer.phone,
          email: customer.email
        }
      }));

      activities.push(...customerActivities);
    }

    // Sort all activities by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    activities = activities.slice(0, limit);

    // Apply date filtering if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();

      activities = activities.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= start && activityDate <= end;
      });
    }

    return NextResponse.json({
      data: activities,
      total: activities.length,
      type,
      limit
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}