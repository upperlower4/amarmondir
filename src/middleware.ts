import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // We disable strict cookie-based redirection in the middleware
  // because AI Studio runs in an iframe and browsers often block
  // 3rd party cookies (SameSite=None), causing auth loops.
  // We will handle session checks in the components/hooks instead.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/add-temple', '/settings/:path*'],
};
