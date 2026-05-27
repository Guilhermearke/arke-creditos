import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function isProtectedPath(pathname: string) {
  return pathname.startsWith('/admin') || pathname.startsWith('/cliente') || pathname.startsWith('/time')
}

function redirectWithCookies(url: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(url)
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })
  return redirectResponse
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const { pathname } = request.nextUrl
  const isLogin = pathname === '/login' || pathname === '/auth/login'
  const protectedPath = isProtectedPath(pathname)

  if (!protectedPath && !isLogin) return response

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && protectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)
    return redirectWithCookies(url, response)
  }

  if (!user) return response

  if (isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = request.nextUrl.searchParams.get('next') || '/admin/dashboard'
    url.search = ''
    return redirectWithCookies(url, response)
  }

  return response
}
