import { NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/admin/auth'
import { getGrowthMetrics, getFeatureUsage, getSystemStats } from '@/lib/admin/queries'
import { createServerClient } from '@/lib/db/supabase-server'

export async function GET() {
  try {
    // Require super admin access
    await requireSuperAdmin()

    // Log action
    await logAdminAction({
      action: 'view_analytics',
    })

    const supabase = await createServerClient()

    // Get growth metrics
    const growth = await getGrowthMetrics(30)

    // Get feature usage
    const usage = await getFeatureUsage()

    // Get system stats
    const systemStats = await getSystemStats()

    // Process growth data for chart
    const growthByDay = new Map<string, { tenants: number; users: number }>()

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      growthByDay.set(dateStr, { tenants: 0, users: 0 })
    }

    // Count tenants by day
    growth.tenantGrowth.forEach((item: any) => {
      const dateStr = new Date(item.created_at).toISOString().split('T')[0]
      const existing = growthByDay.get(dateStr)
      if (existing) {
        existing.tenants++
      }
    })

    // Count users by day
    growth.userGrowth.forEach((item: any) => {
      const dateStr = new Date(item.created_at).toISOString().split('T')[0]
      const existing = growthByDay.get(dateStr)
      if (existing) {
        existing.users++
      }
    })

    const growthData = Array.from(growthByDay.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
        tenants: data.tenants,
        users: data.users,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Subscription tier distribution
    const subscriptionData = [
      { name: 'Starter', value: systemStats?.starter_tier_count || 0 },
      { name: 'Pro', value: systemStats?.pro_tier_count || 0 },
      { name: 'Team', value: systemStats?.team_tier_count || 0 },
    ]

    // Subscription status distribution
    const { data: tenants } = await supabase
      .from('tenants')
      .select('subscription_status')

    const statusCounts = tenants?.reduce((acc: any, tenant: any) => {
      acc[tenant.subscription_status] = (acc[tenant.subscription_status] || 0) + 1
      return acc
    }, {})

    const statusData = Object.entries(statusCounts || {}).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))

    // Feature usage
    const featureUsage = [
      { feature: 'Quotes', count: usage.quoteStats?.length || 0 },
      { feature: 'Jobs', count: usage.jobStats?.length || 0 },
      { feature: 'Invoices', count: usage.invoiceStats?.length || 0 },
    ]

    // Quote status breakdown
    const quoteStatusCounts = usage.quoteStats?.reduce((acc: any, quote: any) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1
      return acc
    }, {})

    const quoteStatusBreakdown = Object.entries(quoteStatusCounts || {}).map(
      ([status, count]) => ({
        status,
        count,
      })
    )

    // Job status breakdown
    const jobStatusCounts = usage.jobStats?.reduce((acc: any, job: any) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {})

    const jobStatusBreakdown = Object.entries(jobStatusCounts || {}).map(([status, count]) => ({
      status,
      count,
    }))

    // Invoice status breakdown
    const invoiceStatusCounts = usage.invoiceStats?.reduce((acc: any, invoice: any) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1
      return acc
    }, {})

    const invoiceStatusBreakdown = Object.entries(invoiceStatusCounts || {}).map(
      ([status, count]) => ({
        status,
        count,
      })
    )

    const formatCurrency = (amount: number) => {
      return `R${amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    }

    return NextResponse.json({
      growthData,
      subscriptionData,
      statusData,
      featureUsage,
      avgQuoteValue: formatCurrency(usage.avgQuoteValue),
      avgInvoiceValue: formatCurrency(usage.avgInvoiceValue),
      quoteAcceptanceRate: `${usage.quoteAcceptanceRate.toFixed(1)}%`,
      invoicePaymentRate: `${usage.invoicePaymentRate.toFixed(1)}%`,
      quoteStatusBreakdown,
      jobStatusBreakdown,
      invoiceStatusBreakdown,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Unauthorized or error fetching analytics' },
      { status: 403 }
    )
  }
}
