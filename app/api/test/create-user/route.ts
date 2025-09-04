import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/repositories/user.repository';

export async function POST(request: NextRequest) {
  try {
    const userRepo = new UserRepository(true); // Use service role
    
    const testUser = await userRepo.create({
      id: crypto.randomUUID(),
      email: 'test-' + Date.now() + '@example.com',
      full_name: 'Test User',
      role: 'technician',
    });

    return NextResponse.json({ success: true, user: testUser });
  } catch (error) {
    console.error('Test create user error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}