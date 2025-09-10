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

    // Get all active devices with manufacturer info using repository method
    const devices = await deviceRepo.getActiveDevices();

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
      // Get popular device IDs from repository method
      const popularDeviceIds = await deviceRepo.getPopularDeviceIds(100);
      
      // Create a map of device counts for quick lookup
      const deviceCounts = popularDeviceIds.reduce((acc: Record<string, number>, item) => {
        acc[item.device_id] = item.count;
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

    // Get list of all manufacturers using repository method
    const manufacturers = await deviceRepo.getAllManufacturers();

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