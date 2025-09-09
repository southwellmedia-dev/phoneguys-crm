import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { GlobalSearchService, SearchFilters } from '@/lib/services/global-search.service';

export async function GET(request: NextRequest) {
  // Check authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const types = searchParams.get('types')?.split(',') as SearchFilters['types'];
    const limit = searchParams.get('limit');

    const searchService = new GlobalSearchService();
    const results = await searchService.search(query, {
      types,
      limit: limit ? parseInt(limit, 10) : undefined
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}