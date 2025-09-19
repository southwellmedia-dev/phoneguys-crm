import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    if (!from || !to) {
      return NextResponse.json({ error: 'Date range required' }, { status: 400 });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Get all tickets in date range
    const { data: tickets, error: ticketsError } = await supabase
      .from('repair_tickets')
      .select('*')
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString());

    if (ticketsError) throw ticketsError;

    // Analyze device data
    const brandCount: Record<string, number> = {};
    const modelCount: Record<string, { brand: string; count: number }> = {};
    const issuesByBrand: Record<string, Record<string, number>> = {};
    const repairStats: Record<string, { success: number; total: number; totalTime: number }> = {};
    const deviceTypeCount = {
      'Smartphones': 0,
      'Tablets': 0,
      'Smartwatches': 0,
      'Earbuds': 0,
      'Other': 0
    };

    tickets?.forEach(ticket => {
      const brand = ticket.device_brand || 'Unknown';
      const model = ticket.device_model || 'Unknown';
      const modelKey = `${brand} ${model}`;

      // Count brands
      brandCount[brand] = (brandCount[brand] || 0) + 1;

      // Count models
      if (!modelCount[modelKey]) {
        modelCount[modelKey] = { brand, count: 0 };
      }
      modelCount[modelKey].count++;

      // Track issues by brand
      if (!issuesByBrand[brand]) {
        issuesByBrand[brand] = {};
      }
      
      ticket.repair_issues?.forEach((issue: string) => {
        if (!issuesByBrand[brand][issue]) {
          issuesByBrand[brand][issue] = 0;
        }
        issuesByBrand[brand][issue]++;
      });

      // Track repair success rates
      if (!repairStats[brand]) {
        repairStats[brand] = { success: 0, total: 0, totalTime: 0 };
      }
      repairStats[brand].total++;
      if (ticket.status === 'completed') {
        repairStats[brand].success++;
      }
      if (ticket.total_time_minutes) {
        repairStats[brand].totalTime += ticket.total_time_minutes / 60;
      }

      // Categorize device types (simplified)
      const modelLower = model.toLowerCase();
      if (modelLower.includes('ipad') || modelLower.includes('tab')) {
        deviceTypeCount['Tablets']++;
      } else if (modelLower.includes('watch')) {
        deviceTypeCount['Smartwatches']++;
      } else if (modelLower.includes('pods') || modelLower.includes('buds')) {
        deviceTypeCount['Earbuds']++;
      } else if (brand !== 'Unknown') {
        deviceTypeCount['Smartphones']++;
      } else {
        deviceTypeCount['Other']++;
      }
    });

    // Format top brands
    const totalTickets = tickets?.length || 1;
    const topBrands = Object.entries(brandCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand, count]) => ({
        brand,
        count,
        percentage: Math.round((count / totalTickets) * 100)
      }));

    // Format top models
    const topModels = Object.entries(modelCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([model, data]) => ({
        model: model.replace(data.brand + ' ', ''),
        brand: data.brand,
        count: data.count
      }));

    // Format issues by brand (top 4 brands)
    const topBrandNames = topBrands.slice(0, 4).map(b => b.brand);
    const issuesByBrandFormatted = topBrandNames.map(brand => {
      const issues = issuesByBrand[brand] || {};
      const issueTypes = ['screen', 'battery', 'water', 'charging', 'other'];
      
      const formattedIssues: any = { brand };
      issueTypes.forEach(type => {
        formattedIssues[type] = 0;
      });

      Object.entries(issues).forEach(([issue, count]) => {
        if (issue.includes('screen') || issue.includes('crack')) {
          formattedIssues.screen += count;
        } else if (issue.includes('battery')) {
          formattedIssues.battery += count;
        } else if (issue.includes('water')) {
          formattedIssues.water += count;
        } else if (issue.includes('charging') || issue.includes('port')) {
          formattedIssues.charging += count;
        } else {
          formattedIssues.other += count;
        }
      });

      return formattedIssues;
    });

    // Calculate repair success rates
    const repairSuccessRate = Object.entries(repairStats)
      .filter(([_, stats]) => stats.total > 0)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([brand, stats]) => ({
        brand,
        successRate: Math.round((stats.success / stats.total) * 100),
        avgTime: stats.total > 0 
          ? Math.round(stats.totalTime / stats.total * 10) / 10
          : 0
      }));

    // Format device types
    const deviceTypes = Object.entries(deviceTypeCount)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        type,
        count,
        icon: type.toLowerCase()
      }));

    return NextResponse.json({
      topBrands,
      topModels,
      issuesByBrand: issuesByBrandFormatted,
      repairSuccessRate,
      deviceTypes
    });

  } catch (error) {
    console.error('Error fetching device data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch device data' },
      { status: 500 }
    );
  }
}