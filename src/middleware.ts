import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get session from cookie (Supabase sets this)
  const supabaseSession = request.cookies.get('sb-access-token')?.value ||
    request.cookies.get('supabase-auth-token')?.value

  const isAuthPage = pathname.startsWith('/auth')
  const isAdminPage = pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')
  const isOwnerPage = pathname.startsWith('/owner')
  const isDashboardPage = pathname.startsWith('/dashboard')

  let userRole = 'user'
  if (supabaseSession) {
    try {
      // Decode JWT payload (second part of token)
      const payloadB64 = supabaseSession.split('.')[1]
      const payloadStr = atob(payloadB64)
      const payload = JSON.parse(payloadStr)
      userRole = payload.user_metadata?.role || 'user'
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // If not logged in and trying to access protected routes
  if (!supabaseSession && (isAdminPage || isOwnerPage || isDashboardPage)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Enforce role-based routing
  if (supabaseSession) {
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    if (userRole === 'user' && (isAdminPage || isOwnerPage)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    if (userRole === 'owner' && isAdminPage) {
      return NextResponse.redirect(new URL('/owner', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/owner/:path*', '/dashboard/:path*', '/auth/:path*'],
}
