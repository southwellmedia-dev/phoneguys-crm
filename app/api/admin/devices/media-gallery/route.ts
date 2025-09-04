import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Use service client to access storage
    const serviceClient = createServiceClient();
    
    // List all files in the device-images bucket
    const { data: files, error } = await serviceClient.storage
      .from('device-images')
      .list('', {
        limit: 100, // Get more files to filter from
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw new Error(`Failed to fetch images: ${error.message}`);
    }

    if (!files) {
      return NextResponse.json({ data: [] });
    }

    // Filter files by search term if provided
    let filteredFiles = files.filter(file => 
      file.name.toLowerCase().includes(search.toLowerCase())
    );

    // Limit results
    filteredFiles = filteredFiles.slice(0, limit);

    // Get public URLs for the filtered files
    const filesWithUrls = filteredFiles.map(file => {
      const { data: { publicUrl } } = serviceClient.storage
        .from('device-images')
        .getPublicUrl(file.name);

      return {
        id: file.id,
        name: file.name,
        url: publicUrl,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
        updated_at: file.updated_at,
      };
    });

    return NextResponse.json({ 
      data: filesWithUrls,
      total: files.length 
    });

  } catch (error) {
    console.error('Error fetching media gallery:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch media gallery' },
      { status: 500 }
    );
  }
}