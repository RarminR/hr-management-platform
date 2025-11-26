import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  return NextResponse.json({
    session,
    authenticated: !!session,
  });
}