/**
 * Check and grant super admin access to your user
 * Run this script with: npx tsx scripts/check-super-admin.ts <your-email>
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

async function checkSuperAdmin() {
  const email = process.argv[2]

  if (!email) {
    console.error('❌ Please provide your email address')
    console.error('   Usage: npx tsx scripts/check-super-admin.ts your@email.com')
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables in .env.local')
    process.exit(1)
  }

  console.log('🔧 Connecting to Supabase...')
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Find user by email
    console.log(`🔍 Looking for user with email: ${email}`)
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)

    if (fetchError) {
      throw fetchError
    }

    if (!users || users.length === 0) {
      console.error(`❌ No user found with email: ${email}`)
      console.log('\n💡 Make sure you:')
      console.log('   1. Signed up for an account')
      console.log('   2. Are using the correct email address')
      process.exit(1)
    }

    const user = users[0]

    console.log('✅ User found:')
    console.log('   - Name:', user.full_name)
    console.log('   - Email:', user.email)
    console.log('   - Super Admin:', user.is_super_admin ? 'YES' : 'NO')

    if (user.is_super_admin) {
      console.log('\n✨ You already have super admin access!')
      return
    }

    // Grant super admin access
    console.log('\n🔑 Granting super admin access...')
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_super_admin: true })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    console.log('✅ Super admin access granted!')
    console.log('\n✨ You can now access the Admin Settings page')
    console.log('   Refresh your browser to see the changes')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the check
checkSuperAdmin()
