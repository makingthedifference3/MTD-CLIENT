import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://dswxwttfncjyraagcbci.supabase.co"
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzd3h3dHRmbmNqeXJhYWdjYmNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY2MTIzOSwiZXhwIjoyMDc5MjM3MjM5fQ.35WAfOYpCvAP4c5m_wZhzvgZSpH2_U6IU1sAuhv3N8Q"


if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set.')
  process.exit(1)
}


const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})



const createUsers = async () => {
  const users = [
    { email: 'client@interise.com', password: 'demo123', full_name: 'Interise Client', role: 'client' },
    { email: 'client@tcs.com', password: 'demo123', full_name: 'TCS Marathon Team', role: 'client' }
  ]

  for (const user of users) {
    // Hash the password with bcrypt for your own table
    const hashedPassword = await bcrypt.hash(user.password, 10)

    // Find the user by email to get the auth_id
    const { data: userData, error: userFetchError } = await supabase.from('users').select('auth_id').eq('email', user.email).single()
    if (userFetchError || !userData) {
      console.error(`❌ Could not find user in users table for ${user.email}:`, userFetchError?.message)
      continue
    }

    // Update password in Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(userData.auth_id, {
      password: user.password
    })
    if (authError) {
      console.error(`❌ Auth error for ${user.email}:`, authError.message)
      continue
    }

    // Update hashed password in your own users table
    const { error: updateError } = await supabase.from('users').update({ password: hashedPassword }).eq('auth_id', userData.auth_id)
    if (updateError) {
      console.error(`❌ Update error for ${user.email}:`, updateError.message)
    } else {
      console.log(`✅ Password updated for: ${user.email}`)
    }
  }
}

createUsers().catch(console.error)
