import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/cliente/:path*',
    '/time/:path*',
    '/login',
    '/auth/login',
  ],
}
