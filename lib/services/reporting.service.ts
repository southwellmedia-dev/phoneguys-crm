import { RepairTicketRepository } from '../repositories/repair-ticket.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { TimeEntryRepository } from '../repositories/time-entry.repository';
import { UserRepository } from '../repositories/user.repository';
import { NotificationRepository } from '../repositories/notification.repository';

export interface DashboardMetrics {
  todayStats: {
    newTickets: number;
    completedTickets: number;
    activeTickets: number;
    revenue: number;
  };
  weekStats: {
    newTickets: number;
    completedTickets: number;
    averageRepairTime: number;
    revenue: number;
  };
  monthStats: {
    newTickets: number;
    completedTickets: number;
    averageRepairTime: number;
    revenue: number;
    topIssues: Array<{ issue: string; count: number }>;
  };
  overallStats: {
    totalTickets: number;
    totalCustomers: number;
    averageRating: number;
    repeatCustomerRate: number;
  };
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  laborRevenue: number;
  partsRevenue: number;
  ticketCount: number;
  averageTicketValue: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    ticketCount: number;
  }>;
  revenueByStatus: Record<string, number>;
  revenueByPriority: Record<string, number>;
}

export interface TechnicianPerformanceReport {
  technicianId: string;
  technicianName: string;
  period: string;
  metrics: {
    ticketsCompleted: number;
    totalHoursWorked: number;
    averageRepairTime: number;
    efficiency: number; // tickets per hour
    revenue: number;
    customerSatisfaction: number;
  };
  ticketsByStatus: Record<string, number>;
  topRepairTypes: Array<{ type: string; count: number }>;
}

export interface DeviceAnalyticsReport {
  period: string;
  topBrands: Array<{ brand: string; count: number; percentage: number }>;
  topModels: Array<{ model: string; brand: string; count: number }>;
  topIssues: Array<{ issue: string; count: number; averageRepairTime: number }>;
  issuesByBrand: Record<string, Record<string, number>>;
}

export class ReportingService {
  private ticketRepo: RepairTicketRepository;
  private customerRepo: CustomerRepository;
  private timeEntryRepo: TimeEntryRepository;
  private userRepo: UserRepository;
  private notificationRepo: NotificationRepository;

  constructor(useServiceRole = false) {
    this.ticketRepo = new RepairTicketRepository(useServiceRole);
    this.customerRepo = new CustomerRepository(useServiceRole);
    this.timeEntryRepo = new TimeEntryRepository(useServiceRole);
    this.userRepo = new UserRepository(useServiceRole);
    this.notificationRepo = new NotificationRepository(useServiceRole);
  }

  /**
   * Get dashboard metrics for the main overview
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Get all tickets for analysis
    const allTickets = await this.ticketRepo.findAll();
    const allCustomers = await this.customerRepo.findAll();

    // Today's stats
    const todayTickets = allTickets.filter(t => 
      new Date(t.created_at) >= today
    );
    const todayCompleted = allTickets.filter(t => 
      t.status === 'completed' && 
      t.completed_at && 
      new Date(t.completed_at) >= today
    );

    // Week stats
    const weekTickets = allTickets.filter(t => 
      new Date(t.created_at) >= weekAgo
    );
    const weekCompleted = allTickets.filter(t => 
      t.status === 'completed' && 
      t.completed_at && 
      new Date(t.completed_at) >= weekAgo
    );

    // Month stats
    const monthTickets = allTickets.filter(t => 
      new Date(t.created_at) >= monthAgo
    );
    const monthCompleted = allTickets.filter(t => 
      t.status === 'completed' && 
      t.completed_at && 
      new Date(t.completed_at) >= monthAgo
    );

    // Calculate issue frequencies for the month
    const issueCount = new Map<string, number>();
    monthTickets.forEach(ticket => {
      ticket.repair_issues.forEach(issue => {
        issueCount.set(issue, (issueCount.get(issue) || 0) + 1);
      });
    });
    const topIssues = Array.from(issueCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));

    // Calculate repeat customer rate
    const customerTicketCount = new Map<string, number>();
    allTickets.forEach(ticket => {
      customerTicketCount.set(
        ticket.customer_id,
        (customerTicketCount.get(ticket.customer_id) || 0) + 1
      );
    });
    const repeatCustomers = Array.from(customerTicketCount.values())
      .filter(count => count > 1).length;
    const repeatCustomerRate = allCustomers.length > 0 
      ? (repeatCustomers / allCustomers.length) * 100 
      : 0;

    return {
      todayStats: {
        newTickets: todayTickets.length,
        completedTickets: todayCompleted.length,
        activeTickets: allTickets.filter(t => 
          ['new', 'in_progress', 'on_hold'].includes(t.status)
        ).length,
        revenue: todayCompleted.reduce((sum, t) => sum + (t.total_cost || 0), 0)
      },
      weekStats: {
        newTickets: weekTickets.length,
        completedTickets: weekCompleted.length,
        averageRepairTime: this.calculateAverageRepairTime(weekCompleted),
        revenue: weekCompleted.reduce((sum, t) => sum + (t.total_cost || 0), 0)
      },
      monthStats: {
        newTickets: monthTickets.length,
        completedTickets: monthCompleted.length,
        averageRepairTime: this.calculateAverageRepairTime(monthCompleted),
        revenue: monthCompleted.reduce((sum, t) => sum + (t.total_cost || 0), 0),
        topIssues
      },
      overallStats: {
        totalTickets: allTickets.length,
        totalCustomers: allCustomers.length,
        averageRating: 4.5, // Placeholder - implement rating system
        repeatCustomerRate: Math.round(repeatCustomerRate)
      }
    };
  }

  /**
   * Generate revenue report for a specific period
   */
  async getRevenueReport(
    startDate: Date,
    endDate: Date
  ): Promise<RevenueReport> {
    // Get completed tickets in the period
    const allTickets = await this.ticketRepo.findAll();
    const periodTickets = allTickets.filter(ticket => {
      if (ticket.status !== 'completed' || !ticket.completed_at) return false;
      const completedDate = new Date(ticket.completed_at);
      return completedDate >= startDate && completedDate <= endDate;
    });

    // Calculate revenue breakdown
    const totalRevenue = periodTickets.reduce((sum, t) => sum + (t.total_cost || 0), 0);
    // Note: labor_cost column doesn't exist, using actual_cost instead as it represents labor
    const laborRevenue = periodTickets.reduce((sum, t) => sum + (t.actual_cost || 0), 0);
    const partsRevenue = totalRevenue - laborRevenue;

    // Revenue by status (for all tickets, not just completed)
    const allPeriodTickets = allTickets.filter(ticket => {
      const createdDate = new Date(ticket.created_at);
      return createdDate >= startDate && createdDate <= endDate;
    });

    const revenueByStatus: Record<string, number> = {};
    allPeriodTickets.forEach(ticket => {
      revenueByStatus[ticket.status] = 
        (revenueByStatus[ticket.status] || 0) + (ticket.total_cost || 0);
    });

    // Revenue by priority
    const revenueByPriority: Record<string, number> = {};
    periodTickets.forEach(ticket => {
      const priority = ticket.priority || 'medium';
      revenueByPriority[priority] = 
        (revenueByPriority[priority] || 0) + (ticket.total_cost || 0);
    });

    // Top customers by revenue
    const customerRevenue = new Map<string, {
      totalSpent: number;
      ticketCount: number;
    }>();

    for (const ticket of periodTickets) {
      if (!customerRevenue.has(ticket.customer_id)) {
        customerRevenue.set(ticket.customer_id, {
          totalSpent: 0,
          ticketCount: 0
        });
      }
      const stats = customerRevenue.get(ticket.customer_id)!;
      stats.totalSpent += ticket.total_cost || 0;
      stats.ticketCount++;
    }

    const topCustomers = [];
    for (const [customerId, stats] of customerRevenue.entries()) {
      const customer = await this.customerRepo.findById(customerId);
      if (customer) {
        topCustomers.push({
          customerId,
          customerName: customer.name,
          ...stats
        });
      }
    }
    topCustomers.sort((a, b) => b.totalSpent - a.totalSpent);

    return {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      totalRevenue,
      laborRevenue,
      partsRevenue,
      ticketCount: periodTickets.length,
      averageTicketValue: periodTickets.length > 0 
        ? totalRevenue / periodTickets.length 
        : 0,
      topCustomers: topCustomers.slice(0, 10),
      revenueByStatus,
      revenueByPriority
    };
  }

  /**
   * Generate technician performance report
   */
  async getTechnicianPerformanceReport(
    technicianId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TechnicianPerformanceReport> {
    const technician = await this.userRepo.findById(technicianId);
    if (!technician) {
      throw new Error('Technician not found');
    }

    // Get time entries for the period
    const allTimeEntries = await this.timeEntryRepo.findByUserId(technicianId);
    const periodEntries = allTimeEntries.filter(entry => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Get unique tickets worked on
    const ticketIds = new Set(periodEntries.map(e => e.ticket_id));
    const tickets = await Promise.all(
      Array.from(ticketIds).map(id => this.ticketRepo.findById(id))
    );
    const validTickets = tickets.filter(t => t !== null);

    // Calculate metrics
    const completedTickets = validTickets.filter(t => 
      t.status === 'completed' &&
      t.completed_at &&
      new Date(t.completed_at) >= startDate &&
      new Date(t.completed_at) <= endDate
    );

    const totalMinutesWorked = periodEntries.reduce(
      (sum, entry) => sum + entry.duration_minutes,
      0
    );
    const totalHoursWorked = totalMinutesWorked / 60;

    const averageRepairTime = completedTickets.length > 0
      ? this.calculateAverageRepairTime(completedTickets)
      : 0;

    const efficiency = totalHoursWorked > 0
      ? completedTickets.length / totalHoursWorked
      : 0;

    const revenue = completedTickets.reduce(
      (sum, ticket) => sum + (ticket.total_cost || 0),
      0
    );

    // Tickets by status
    const ticketsByStatus: Record<string, number> = {};
    validTickets.forEach(ticket => {
      ticketsByStatus[ticket.status] = 
        (ticketsByStatus[ticket.status] || 0) + 1;
    });

    // Top repair types
    const repairTypeCount = new Map<string, number>();
    validTickets.forEach(ticket => {
      ticket.repair_issues.forEach(issue => {
        repairTypeCount.set(issue, (repairTypeCount.get(issue) || 0) + 1);
      });
    });
    const topRepairTypes = Array.from(repairTypeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return {
      technicianId,
      technicianName: technician.email,
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      metrics: {
        ticketsCompleted: completedTickets.length,
        totalHoursWorked,
        averageRepairTime,
        efficiency,
        revenue,
        customerSatisfaction: 4.5 // Placeholder - implement rating system
      },
      ticketsByStatus,
      topRepairTypes
    };
  }

  /**
   * Generate device analytics report
   */
  async getDeviceAnalyticsReport(
    startDate: Date,
    endDate: Date
  ): Promise<DeviceAnalyticsReport> {
    const allTickets = await this.ticketRepo.findAll();
    const periodTickets = allTickets.filter(ticket => {
      const createdDate = new Date(ticket.created_at);
      return createdDate >= startDate && createdDate <= endDate;
    });

    // Brand analytics
    const brandCount = new Map<string, number>();
    periodTickets.forEach(ticket => {
      brandCount.set(
        ticket.device_brand,
        (brandCount.get(ticket.device_brand) || 0) + 1
      );
    });

    const totalTickets = periodTickets.length;
    const topBrands = Array.from(brandCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([brand, count]) => ({
        brand,
        count,
        percentage: (count / totalTickets) * 100
      }));

    // Model analytics
    const modelCount = new Map<string, { brand: string; count: number }>();
    periodTickets.forEach(ticket => {
      const key = `${ticket.device_brand}-${ticket.device_model}`;
      if (!modelCount.has(key)) {
        modelCount.set(key, { brand: ticket.device_brand, count: 0 });
      }
      modelCount.get(key)!.count++;
    });

    const topModels = Array.from(modelCount.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([key, data]) => ({
        model: key.split('-')[1],
        brand: data.brand,
        count: data.count
      }));

    // Issue analytics
    const issueStats = new Map<string, {
      count: number;
      totalTime: number;
      tickets: Set<string>;
    }>();

    for (const ticket of periodTickets) {
      for (const issue of ticket.repair_issues) {
        if (!issueStats.has(issue)) {
          issueStats.set(issue, {
            count: 0,
            totalTime: 0,
            tickets: new Set()
          });
        }
        const stats = issueStats.get(issue)!;
        stats.count++;
        stats.tickets.add(ticket.id);
        
        if (ticket.total_time_minutes) {
          stats.totalTime += ticket.total_time_minutes;
        }
      }
    }

    const topIssues = Array.from(issueStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([issue, stats]) => ({
        issue,
        count: stats.count,
        averageRepairTime: stats.tickets.size > 0 
          ? Math.round(stats.totalTime / stats.tickets.size / 60) 
          : 0
      }));

    // Issues by brand
    const issuesByBrand: Record<string, Record<string, number>> = {};
    periodTickets.forEach(ticket => {
      if (!issuesByBrand[ticket.device_brand]) {
        issuesByBrand[ticket.device_brand] = {};
      }
      ticket.repair_issues.forEach(issue => {
        issuesByBrand[ticket.device_brand][issue] = 
          (issuesByBrand[ticket.device_brand][issue] || 0) + 1;
      });
    });

    return {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      topBrands,
      topModels,
      topIssues,
      issuesByBrand
    };
  }

  /**
   * Generate custom report based on filters
   */
  async getCustomReport(filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string[];
    priority?: string[];
    technicianId?: string;
    customerId?: string;
    deviceBrand?: string;
  }): Promise<any> {
    let tickets = await this.ticketRepo.findAll();

    // Apply filters
    if (filters.startDate) {
      tickets = tickets.filter(t => 
        new Date(t.created_at) >= filters.startDate!
      );
    }
    if (filters.endDate) {
      tickets = tickets.filter(t => 
        new Date(t.created_at) <= filters.endDate!
      );
    }
    if (filters.status && filters.status.length > 0) {
      tickets = tickets.filter(t => 
        filters.status!.includes(t.status)
      );
    }
    if (filters.priority && filters.priority.length > 0) {
      tickets = tickets.filter(t => 
        filters.priority!.includes(t.priority || 'medium')
      );
    }
    if (filters.customerId) {
      tickets = tickets.filter(t => 
        t.customer_id === filters.customerId
      );
    }
    if (filters.deviceBrand) {
      tickets = tickets.filter(t => 
        t.device_brand === filters.deviceBrand
      );
    }

    // If technician filter, get their tickets
    if (filters.technicianId) {
      const timeEntries = await this.timeEntryRepo.findByUserId(filters.technicianId);
      const techTicketIds = new Set(timeEntries.map(e => e.ticket_id));
      tickets = tickets.filter(t => techTicketIds.has(t.id));
    }

    // Calculate summary statistics
    const summary = {
      totalTickets: tickets.length,
      totalRevenue: tickets.reduce((sum, t) => sum + (t.total_cost || 0), 0),
      averageTicketValue: 0,
      averageRepairTime: 0,
      statusBreakdown: {} as Record<string, number>,
      priorityBreakdown: {} as Record<string, number>,
      issueFrequency: {} as Record<string, number>
    };

    if (tickets.length > 0) {
      summary.averageTicketValue = summary.totalRevenue / tickets.length;
      summary.averageRepairTime = this.calculateAverageRepairTime(
        tickets.filter(t => t.status === 'completed')
      );
    }

    // Status breakdown
    tickets.forEach(ticket => {
      summary.statusBreakdown[ticket.status] = 
        (summary.statusBreakdown[ticket.status] || 0) + 1;
      
      const priority = ticket.priority || 'medium';
      summary.priorityBreakdown[priority] = 
        (summary.priorityBreakdown[priority] || 0) + 1;

      ticket.repair_issues.forEach(issue => {
        summary.issueFrequency[issue] = 
          (summary.issueFrequency[issue] || 0) + 1;
      });
    });

    return {
      filters,
      summary,
      tickets: tickets.slice(0, 100), // Limit to 100 for performance
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate average repair time in hours
   */
  private calculateAverageRepairTime(tickets: any[]): number {
    const completedWithTime = tickets.filter(t => 
      t.completed_at && t.created_at
    );

    if (completedWithTime.length === 0) return 0;

    const totalTime = completedWithTime.reduce((sum, ticket) => {
      const start = new Date(ticket.created_at).getTime();
      const end = new Date(ticket.completed_at).getTime();
      return sum + (end - start);
    }, 0);

    // Return in hours
    return Math.round(totalTime / completedWithTime.length / (1000 * 60 * 60));
  }

  /**
   * Export report to CSV format
   */
  async exportReportToCSV(reportType: string, data: any): Promise<string> {
    // This is a simplified CSV export
    // In production, use a proper CSV library
    
    let csv = '';
    
    if (reportType === 'revenue') {
      csv = 'Period,Total Revenue,Labor Revenue,Parts Revenue,Ticket Count,Avg Ticket Value\n';
      csv += `"${data.period}",${data.totalRevenue},${data.laborRevenue},${data.partsRevenue},${data.ticketCount},${data.averageTicketValue}\n`;
    } else if (reportType === 'dashboard') {
      csv = 'Metric,Value\n';
      csv += `Today New Tickets,${data.todayStats.newTickets}\n`;
      csv += `Today Completed,${data.todayStats.completedTickets}\n`;
      csv += `Today Revenue,${data.todayStats.revenue}\n`;
      csv += `Total Customers,${data.overallStats.totalCustomers}\n`;
    }
    
    return csv;
  }
}