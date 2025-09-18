import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requirePermission, handleApiError, successResponse } from '@/lib/auth/helpers';
import { Permission } from '@/lib/services/authorization.service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET endpoint to fetch deletion preview data
 * Shows what will be deleted if cascade delete is performed
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const authResult = await requirePermission(request, Permission.CUSTOMER_DELETE);
    if (authResult instanceof NextResponse) return authResult;

    const supabase = await createClient();
    const customerId = resolvedParams.id;
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Auth user:', { id: user.id, email: user.email });

    // Try to find by email first (more reliable with current seed data)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email || '')
      .single();
    
    console.log('Profile lookup result:', { profile, error: profileError });
    
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
    console.log('Is admin?', isAdmin, 'Role:', profile?.role);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can delete customers' },
        { status: 403 }
      );
    }

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get all related data counts
    const ticketsResult = await supabase.from('repair_tickets').select('id, ticket_number, status').eq('customer_id', customerId);
    const ticketIds = ticketsResult.data?.map(t => t.id) || [];
    
    const [tickets, appointments, devices, timeEntries, notifications] = await Promise.all([
      Promise.resolve(ticketsResult),
      supabase.from('appointments').select('id, appointment_date, status').eq('customer_id', customerId),
      supabase.from('customer_devices').select('id, device:devices(id, device_type, model)').eq('customer_id', customerId),
      ticketIds.length > 0 
        ? supabase.from('time_entries').select('id').in('ticket_id', ticketIds)
        : Promise.resolve({ data: [], error: null }),
      ticketIds.length > 0
        ? supabase.from('notifications').select('id').in('ticket_id', ticketIds)
        : Promise.resolve({ data: [], error: null })
    ]);

    const preview = {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      relatedData: {
        repairTickets: {
          count: tickets.data?.length || 0,
          activeCount: tickets.data?.filter(t => ['new', 'in_progress', 'on_hold'].includes(t.status)).length || 0,
          items: tickets.data?.slice(0, 5) || []
        },
        appointments: {
          count: appointments.data?.length || 0,
          upcomingCount: appointments.data?.filter(a => 
            new Date(a.appointment_date) > new Date() && a.status !== 'cancelled'
          ).length || 0,
          items: appointments.data?.slice(0, 5) || []
        },
        devices: {
          count: devices.data?.length || 0,
          items: devices.data?.slice(0, 5) || []
        },
        timeEntries: {
          count: timeEntries.data?.length || 0
        },
        notifications: {
          count: notifications.data?.length || 0
        }
      },
      totalRelatedRecords: 
        (tickets.data?.length || 0) + 
        (appointments.data?.length || 0) + 
        (devices.data?.length || 0) +
        (timeEntries.data?.length || 0) +
        (notifications.data?.length || 0)
    };

    return successResponse(preview);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE endpoint to perform cascade deletion
 * Deletes all related data and then the customer
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const authResult = await requirePermission(request, Permission.CUSTOMER_DELETE);
    if (authResult instanceof NextResponse) return authResult;

    const supabase = await createClient();
    const customerId = resolvedParams.id;
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Auth user:', { id: user.id, email: user.email });

    // Try to find by email first (more reliable with current seed data)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email || '')
      .single();
    
    console.log('Profile lookup result:', { profile, error: profileError });
    
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
    console.log('Is admin?', isAdmin, 'Role:', profile?.role);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can delete customers' },
        { status: 403 }
      );
    }

    // Verify customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get all repair ticket IDs for this customer (needed for dependent deletions)
    const { data: ticketIds } = await supabase
      .from('repair_tickets')
      .select('id')
      .eq('customer_id', customerId);

    const ticketIdList = ticketIds?.map(t => t.id) || [];

    // Perform cascade deletion in correct order (respecting foreign key constraints)
    const deletionSteps = [];
    const stepNames = [];

    // 1. Delete time entries (if there are tickets)
    if (ticketIdList.length > 0) {
      deletionSteps.push(
        supabase.from('time_entries').delete().in('ticket_id', ticketIdList)
      );
      stepNames.push('time_entries');
    }

    // 2. Delete ticket notes (if there are tickets)
    if (ticketIdList.length > 0) {
      deletionSteps.push(
        supabase.from('ticket_notes').delete().in('ticket_id', ticketIdList)
      );
      stepNames.push('ticket_notes');
    }

    // 3. Delete repair tickets first (since they reference appointments via appointment_id)
    if (ticketIdList.length > 0) {
      deletionSteps.push(
        supabase.from('repair_tickets').delete().eq('customer_id', customerId).select()
      );
      stepNames.push('repair_tickets');
    }

    // 4. Delete ALL appointments for this customer (after tickets are deleted)
    deletionSteps.push(
      supabase.from('appointments').delete().eq('customer_id', customerId).select()
    );
    stepNames.push('appointments');

    // 5. Delete customer_devices (the junction table)
    deletionSteps.push(
      supabase.from('customer_devices').delete().eq('customer_id', customerId).select()
    );
    stepNames.push('customer_devices');

    // 6. Delete notification preferences for this customer
    deletionSteps.push(
      supabase.from('notification_preferences').delete().eq('customer_id', customerId).select()
    );
    stepNames.push('notification_preferences');

    // 7. Delete any comments related to customer entities
    deletionSteps.push(
      supabase.from('comments').delete().eq('entity_type', 'customer').eq('entity_id', customerId).select()
    );
    stepNames.push('customer_comments');

    // Execute all deletions
    console.log(`Starting cascade deletion for customer ${customerId}`);
    console.log('Deletion steps to execute:', deletionSteps.length);
    console.log('Ticket IDs to delete time entries for:', ticketIdList);
    
    // Execute deletions one by one to see which fails
    const results = [];
    
    for (let i = 0; i < deletionSteps.length; i++) {
      console.log(`Executing deletion step ${i + 1}: ${stepNames[i]}`);
      const result = await deletionSteps[i];
      console.log(`Result for ${stepNames[i]}:`, { 
        count: result.data?.length || 0,
        error: result.error 
      });
      results.push(result);
      if (result.error) {
        console.error(`Failed at step ${stepNames[i]}:`, result.error);
        break;
      }
    }
    
    // Check for errors in deletion steps
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Cascade deletion errors:', errors.map(e => ({
        error: e.error?.message,
        code: e.error?.code,
        details: e.error?.details
      })));
      return NextResponse.json(
        { 
          error: 'Failed to delete some related data', 
          details: errors.map(e => e.error?.message),
          errorCodes: errors.map(e => e.error?.code)
        },
        { status: 500 }
      );
    }
    
    console.log('All related data deleted successfully');

    // 8. Finally, delete the customer
    const { data: deletedCustomer, error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .select();

    if (deleteError) {
      console.error('Customer deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete customer', details: deleteError.message },
        { status: 500 }
      );
    }

    // Check if any customer was actually deleted
    if (!deletedCustomer || deletedCustomer.length === 0) {
      console.error('Customer was not deleted - no rows affected');
      // This might be due to RLS or foreign key constraints
      // Let's check if the customer still exists
      const { data: stillExists } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customerId);
      
      if (stillExists && stillExists.length > 0) {
        return NextResponse.json(
          { error: 'Failed to delete customer. There may be remaining related data preventing deletion.' },
          { status: 500 }
        );
      }
      // If customer doesn't exist, it was already deleted (success)
    }

    // Log the deletion for audit purposes
    console.log(`Customer ${customer.name} (ID: ${customerId}) and all related data deleted by user ${user?.id}`);

    return successResponse(
      { 
        deleted: true, 
        customerId,
        customerName: customer.name,
        message: `Customer "${customer.name}" and all related data have been permanently deleted`
      }, 
      'Customer and all related data deleted successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}