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
 * GET /api/public/services
 * Public endpoint for fetching available repair services
 * Used by the embeddable widget for issue selection
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const deviceId = searchParams.get('deviceId');

    const serviceRepo = getRepository.services(true); // Use service role

    // Get all active services
    const services = await serviceRepo.findAll();
    
    // Filter active services only
    let activeServices = services.filter(s => s.is_active);

    // Filter by category if provided
    if (category) {
      activeServices = activeServices.filter(s => s.category === category);
    }

    // If deviceId is provided, get device-specific services
    if (deviceId) {
      // Get device-specific service pricing/availability
      const deviceServicesQuery = await serviceRepo.supabase
        .from('device_services')
        .select('service_id, custom_price, custom_duration')
        .eq('device_id', deviceId);
      
      const deviceServices = deviceServicesQuery.data || [];
      const deviceServiceIds = new Set(deviceServices.map((ds: any) => ds.service_id));
      
      // Filter to only services available for this device
      if (deviceServices.length > 0) {
        activeServices = activeServices.filter(s => deviceServiceIds.has(s.id));
        
        // Apply custom pricing if available
        activeServices = activeServices.map(service => {
          const deviceService = deviceServices.find((ds: any) => ds.service_id === service.id);
          if (deviceService) {
            return {
              ...service,
              price: deviceService.custom_price || service.price,
              estimated_duration: deviceService.custom_duration || service.estimated_duration
            };
          }
          return service;
        });
      }
    }

    // Group services by category for easier display
    const groupedServices = activeServices.reduce((acc: any, service) => {
      const category = service.category || 'other';
      if (!acc[category]) {
        acc[category] = {
          name: formatCategoryName(category),
          services: []
        };
      }
      
      acc[category].services.push({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        estimatedDuration: service.estimated_duration,
        category: service.category,
        requiresQuote: service.requires_quote,
        skillLevel: service.skill_level
      });
      
      return acc;
    }, {});

    // Convert to array format
    const categories = Object.keys(groupedServices).map(key => ({
      category: key,
      ...groupedServices[key]
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          categories,
          services: activeServices.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: s.price,
            estimatedDuration: s.estimated_duration,
            category: s.category,
            requiresQuote: s.requires_quote
          }))
        }
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in GET /api/public/services:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch services'
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

/**
 * OPTIONS /api/public/services
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Helper function to format category names
function formatCategoryName(category: string): string {
  const categoryNames: Record<string, string> = {
    screen_repair: 'Screen Repair',
    battery_replacement: 'Battery Replacement',
    charging_port: 'Charging Port',
    water_damage: 'Water Damage',
    diagnostic: 'Diagnostic',
    software_issue: 'Software Issues',
    camera_repair: 'Camera Repair',
    speaker_repair: 'Speaker Repair',
    button_repair: 'Button Repair',
    motherboard_repair: 'Motherboard Repair',
    data_recovery: 'Data Recovery',
    other: 'Other Services'
  };
  
  return categoryNames[category] || category;
}