import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repositories/repository-manager';

// CORS headers for embeddable widget
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

/**
 * GET /api/public/devices
 * Public endpoint for fetching available devices
 * Used by the embeddable widget for device selection
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manufacturer = searchParams.get('manufacturer');
    const search = searchParams.get('search');
    const popular = searchParams.get('popular') === 'true';

    const deviceRepo = getRepository.devices(true); // Use service role

    // Get all active devices with manufacturer info
    const devicesQuery = await deviceRepo.supabase
      .from('devices')
      .select(`
        id,
        model_name,
        device_type,
        manufacturer:manufacturers!devices_manufacturer_id_fkey (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .order('model_name');

    const devices = devicesQuery.data || [];

    let filteredDevices = devices;

    // Filter by manufacturer if provided
    if (manufacturer) {
      filteredDevices = filteredDevices.filter(d => 
        d.manufacturer?.name?.toLowerCase() === manufacturer.toLowerCase()
      );
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDevices = filteredDevices.filter(d => 
        d.model_name.toLowerCase().includes(searchLower) ||
        d.manufacturer?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Get popular devices (most frequently repaired)
    if (popular) {
      // Query repair tickets to find most common device_ids
      const popularQuery = await deviceRepo.supabase
        .from('repair_tickets')
        .select('device_id')
        .not('device_id', 'is', null)
        .limit(100);
      
      const deviceCounts = (popularQuery.data || []).reduce((acc: any, ticket: any) => {
        acc[ticket.device_id] = (acc[ticket.device_id] || 0) + 1;
        return acc;
      }, {});

      // Sort devices by popularity
      filteredDevices = filteredDevices.sort((a, b) => {
        const countA = deviceCounts[a.id] || 0;
        const countB = deviceCounts[b.id] || 0;
        return countB - countA;
      }).slice(0, 10); // Top 10 popular devices
    }

    // Group devices by manufacturer
    const groupedDevices = filteredDevices.reduce((acc: any, device) => {
      const manufacturerName = device.manufacturer?.name || 'Other';
      
      if (!acc[manufacturerName]) {
        acc[manufacturerName] = {
          manufacturer: manufacturerName,
          devices: []
        };
      }
      
      acc[manufacturerName].devices.push({
        id: device.id,
        name: device.model_name,
        type: device.device_type,
        fullName: `${manufacturerName} ${device.model_name}`
      });
      
      return acc;
    }, {});

    // Get list of all manufacturers
    const manufacturersQuery = await deviceRepo.supabase
      .from('manufacturers')
      .select('id, name')
      .order('name');
    
    const manufacturers = (manufacturersQuery.data || []).map(m => ({
      id: m.id,
      name: m.name
    }));

    // Convert grouped devices to array
    const deviceGroups = Object.values(groupedDevices);

    return NextResponse.json(
      {
        success: true,
        data: {
          manufacturers,
          deviceGroups,
          devices: filteredDevices.map(d => ({
            id: d.id,
            name: d.model_name,
            manufacturer: d.manufacturer?.name,
            type: d.device_type,
            fullName: `${d.manufacturer?.name || ''} ${d.model_name}`.trim()
          }))
        }
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in GET /api/public/devices:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch devices'
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

/**
 * OPTIONS /api/public/devices
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}