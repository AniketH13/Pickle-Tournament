import { NextResponse } from 'next/server';
import { getAdminConfig } from '@/lib/admin-config';

const VALID_EMAIL = 'picklego@admin.com';
const SESSION_TOKEN = 'pickleball_admin_session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    const config = getAdminConfig();

    if (
      email?.trim().toLowerCase() === VALID_EMAIL &&
      password === config.password
    ) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('pickleball_session', SESSION_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
      return response;
    }

    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
