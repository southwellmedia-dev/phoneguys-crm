import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRepository } from '@/lib/repositories/repository-manager';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const userRepo = getRepository.users();
    console.log('UserRepo type:', typeof userRepo, 'Constructor:', userRepo.constructor.name);
    console.log('UserRepo methods:', Object.getOwnPropertyNames(userRepo));
    console.log('Has findByEmail:', typeof userRepo.findByEmail);
    
    const userData = await userRepo.findByEmail(user.email || '');
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { apiKey, query, limit = 20 } = body;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }
    
    if (!query) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }
    
    console.log(`Searching TechSpecs for: "${query}"`);
    
    // Parse API credentials
    let apiId = '';
    let apiSecret = apiKey;
    
    if (apiKey.includes(':')) {
      [apiId, apiSecret] = apiKey.split(':');
    }
    
    try {
      const searchParams = new URLSearchParams({
        query: query,
        limit: limit.toString()
      });
      
      const response = await fetch(`https://api.techspecs.io/v5/products/search?${searchParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-id': apiId || '68c18c13b5806a0967b28212',
          'x-api-key': apiSecret
        },
        signal: AbortSignal.timeout(15000)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('TechSpecs API error:', errorText);
        
        if (response.status === 401) {
          return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        } else if (response.status === 429) {
          return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }
        
        return NextResponse.json({ 
          error: `TechSpecs API error: ${response.status}` 
        }, { status: response.status });
      }
      
      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        return NextResponse.json({
          success: true,
          devices: [],
          totalResults: 0
        });
      }
      
      // First map all results
      const allDevices = data.data.map((item: any) => {
        const product = item.Product || {};
        const releaseDate = item['Release Date'];
        const thumbnail = item.Thumbnail;
        
        // Extract release year
        let releaseYear = null;
        if (releaseDate) {
          const yearMatch = releaseDate.match(/(\d{4})/);
          if (yearMatch) {
            releaseYear = parseInt(yearMatch[1]);
          }
        }
        
        return {
          external_id: product.id || null,
          brand: product.Brand || '',
          model: product.Version || '',
          model_name: product.Model || '',
          model_number: product.Version || '',
          release_date: releaseDate || null,
          release_year: releaseYear,
          image_url: thumbnail || null,
          category: product.Category || null,
        };
      });
      
      // Deduplicate by model_name - keep only one of each unique model
      const uniqueDeviceMap = new Map<string, any>();
      
      allDevices.forEach((device: any) => {
        const modelKey = device.model_name.toLowerCase().trim();
        
        // Keep the first occurrence of each unique model name
        // Or prefer the one with an image if available
        if (!uniqueDeviceMap.has(modelKey)) {
          uniqueDeviceMap.set(modelKey, device);
        } else {
          // If current device has an image and existing doesn't, replace it
          const existing = uniqueDeviceMap.get(modelKey);
          if (device.image_url && !existing.image_url) {
            uniqueDeviceMap.set(modelKey, device);
          }
        }
      });
      
      // Convert back to array and check which ones exist in database
      const uniqueDevices = Array.from(uniqueDeviceMap.values());
      
      // Check which devices already exist
      const devices = await Promise.all(uniqueDevices.map(async (device: any) => {
        // Check if device already exists in database by model name
        const { data: existingDevice } = await supabase
          .from('devices')
          .select('id')
          .eq('model_name', device.model_name)
          .maybeSingle();
        
        return {
          ...device,
          already_exists: !!existingDevice,
          existing_device_id: existingDevice?.id || null
        };
      }));
      
      // Sort results: non-existing first, then by model name
      const sortedDevices = devices.sort((a, b) => {
        if (a.already_exists !== b.already_exists) {
          return a.already_exists ? 1 : -1;
        }
        return a.model_name.localeCompare(b.model_name);
      });
      
      console.log(`Search results: ${allDevices.length} total, ${uniqueDevices.length} unique, ${devices.filter(d => !d.already_exists).length} new`);
      
      return NextResponse.json({
        success: true,
        devices: sortedDevices,
        totalResults: allDevices.length,
        uniqueResults: uniqueDevices.length,
        duplicatesRemoved: allDevices.length - uniqueDevices.length
      });
      
    } catch (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Search failed' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in device search:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search devices' 
      },
      { status: 500 }
    );
  }
}