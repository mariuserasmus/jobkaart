/**
 * Initialize system_settings record in the database
 * Run this script with: npx tsx scripts/init-system-settings.ts
 *
 * Make sure you have tsx installed: npm install -D tsx
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

const SYSTEM_SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

async function initSystemSettings() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nMake sure these are set in your .env.local file')
    process.exit(1)
  }

  console.log('🔧 Connecting to Supabase...')
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Check if the record exists
    console.log('🔍 Checking if system_settings record exists...')
    const { data: existing, error: fetchError } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', SYSTEM_SETTINGS_ID)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = not found, which is okay
      throw fetchError
    }

    if (existing) {
      console.log('✅ system_settings record already exists:')
      console.log('   - Quotes per month (FREE):', existing.free_quotes_per_month)
      console.log('   - Jobs per month (FREE):', existing.free_jobs_per_month)
      console.log('   - Invoices per month (FREE):', existing.free_invoices_per_month)
      console.log('\n✨ No action needed!')
      return
    }

    // Create the record
    console.log('📝 Creating system_settings record...')
    const { data, error } = await supabase
      .from('system_settings')
      .insert({
        id: SYSTEM_SETTINGS_ID,
        free_quotes_per_month: 5,
        free_jobs_per_month: 5,
        free_invoices_per_month: 5,
        starter_quotes_per_month: 50,
        starter_jobs_per_month: 50,
        starter_invoices_per_month: 50,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    console.log('✅ system_settings record created successfully!')
    console.log('   - Quotes per month (FREE):', data.free_quotes_per_month)
    console.log('   - Jobs per month (FREE):', data.free_jobs_per_month)
    console.log('   - Invoices per month (FREE):', data.free_invoices_per_month)
    console.log('\n✨ Initialization complete!')
  } catch (error) {
    console.error('❌ Error initializing system_settings:', error)
    process.exit(1)
  }
}

// Run the initialization
initSystemSettings()
