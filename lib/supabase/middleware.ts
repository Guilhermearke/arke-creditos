import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Role } from '@/lib/types'

const roleHome: Record<Role, string> = {
  admin: '/admin/dashboard',
  cliente: '/cliente/meu-painel',
  time: '/time/tarefas',
}

function expectedRole(pathname: string): Role | null {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/cliente')) return 'cliente'
  if (pathname.startsWith('/time')) return 'time'
  return null
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
  const protectedRole = expectedRole(pathname)
  const isLogin = pathname === '/login' || pathname === '/auth/login'

  if (!protectedRole && !isLogin) return response

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && protectedRole) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (!user) return response

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as Role | undefined

  if (isLogin && role) {
    const url = request.nextUrl.clone()
    url.pathname = roleHome[role]
    return NextResponse.redirect(url)
  }

  if (protectedRole && role !== protectedRole) {
    const url = request.nextUrl.clone()
    url.pathname = role ? roleHome[role] : '/login'
    return NextResponse.redirect(url)
  }

  return response
}
