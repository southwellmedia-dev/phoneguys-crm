import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/helpers';
import { getCurrentUserInfo } from '@/lib/utils/user-mapping';

export async function GET(request: NextRequest) {
  try {
    // Get auth context from requireAuth
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    // Get user info from getCurrentUserInfo
    const supabase = await createClient();
    const userInfo = await getCurrentUserInfo(supabase);
    
    // Get some sample tickets to see assigned_to values
    const { data: tickets } = await supabase
      .from('repair_tickets')
      .select('id, ticket_number, assigned_to')
      .limit(10);
    
    // Get tickets assigned to the auth user
    const { data: myTickets } = await supabase
      .from('repair_tickets')
      .select('id, ticket_number, assigned_to')
      .eq('assigned_to', authResult.userId)
      .limit(10);
    
    return NextResponse.json({
      authResult: {
        userId: authResult.userId,
        role: authResult.role,
        userEmail: authResult.user.email
      },
      getCurrentUserInfo: userInfo,
      sampleTickets: tickets,
      myTickets: myTickets,
      debug: {
        authUserId: authResult.userId,
        mappedUserId: userInfo?.appUserId,
        match: authResult.userId === userInfo?.appUserId
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}