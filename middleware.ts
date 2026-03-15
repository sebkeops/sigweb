import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isLoginPath = request.nextUrl.pathname === '/admin/login'

  // Vérifie la présence du cookie de session Supabase (format sb-[ref]-auth-token)
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.includes('auth-token')
  )

  if (!hasAuthCookie && !isLoginPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  if (hasAuthCookie && isLoginPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/projets'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
