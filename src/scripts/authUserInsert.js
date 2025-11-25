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
    // { email: 'client@interise.com', password: 'demo123', full_name: 'Interise Client', role: 'client' },
    { email: 'client1@tcs.com', password: 'demo123', full_name: 'TCS Marathon Team', role: 'client' },
    { email: 'client1@amazon.com', password: 'demo123', full_name: 'Amazon CSR', role: 'client' },
  ]

  for (const user of users) {
    // Hash the password with bcrypt for your own table
    const hashedPassword = await bcrypt.hash(user.password, 10)

    // Insert user into Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true
    })
    if (authError) {
      console.error(`❌ Auth error for ${user.email}:`, authError.message)
      continue
    }

    // Insert user into your own users table
    const { error: insertError } = await supabase.from('users').insert({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      password: hashedPassword,
      auth_id: authUser.user?.id
    })
    if (insertError) {
      console.error(`❌ Insert error for ${user.email}:`, insertError.message)
    } else {
      console.log(`✅ User inserted: ${user.email}`)
    }
  }
}

createUsers().catch(console.error)
