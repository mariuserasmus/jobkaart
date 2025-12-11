import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Verify user authentication with server
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Public routes (don't require authentication) - CHECK FIRST!
  const publicPaths = ['/login', '/signup', '/forgot-password', '/quotes/view/', '/invoices/view/', '/q/', '/i/']
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // Protected routes (require authentication)
  const protectedPaths = ['/dashboard', '/customers', '/quotes', '/jobs', '/invoices', '/settings', '/admin']
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // Billing routes (require auth but bypass subscription check)
  const billingPaths = ['/billing']
  const isBillingPath = billingPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // If trying to access protected route without valid user, redirect to login
  // BUT: allow public paths even if they match protected patterns
  if (isProtectedPath && !isPublicPath && (!user || error)) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If logged in and trying to access login/signup, redirect to dashboard
  if (user && !error && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Admin routes (bypass subscription check for super admins)
  const adminPaths = ['/admin']
  const isAdminPath = adminPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // Check subscription status for protected routes (but not billing pages, admin pages, or public pages)
  if (user && !error && isProtectedPath && !isBillingPath && !isAdminPath && !isPublicPath) {
    // Get user's tenant and subscription status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, tenants(subscription_status, trial_ends_at)')
      .eq('id', user.id)
      .single()

    if (!userError && userData) {
      const tenant = userData.tenants as any
      const subscriptionStatus = tenant?.subscription_status
      const trialEndsAt = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : null
      const now = new Date()

      // Check if trial has expired
      const isTrialExpired = trialEndsAt && trialEndsAt < now

      // Block access if subscription is cancelled (regardless of trial date)
      if (subscriptionStatus === 'cancelled') {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/billing/expired'
        return NextResponse.redirect(redirectUrl)
      }

      // Block access if trial has expired
      if (subscriptionStatus === 'trial' && isTrialExpired) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/billing/expired'
        return NextResponse.redirect(redirectUrl)
      }

      // Show warning if subscription is overdue
      if (subscriptionStatus === 'overdue') {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/billing/overdue'
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
