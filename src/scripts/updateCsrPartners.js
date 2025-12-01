import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://dswxwttfncjyraagcbci.supabase.co";
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzd3h3dHRmbmNqeXJhYWdjYmNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY2MTIzOSwiZXhwIjoyMDc5MjM3MjM5fQ.35WAfOYpCvAP4c5m_wZhzvgZSpH2_U6IU1sAuhv3N8Q";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const updatePartners = async () => {
  const updates = [
    {
      name: 'Interise',
      website: 'interiseworld.com',
      primary_color: '#2563eb',
    },
    {
      name: 'Tata Mumbai Marathon',
      website: 'tcs.com',
      primary_color: '#1a1a1a',
    },
  ];

  for (const partner of updates) {
    const { error } = await supabase
      .from('csr_partners')
      .update({ website: partner.website, primary_color: partner.primary_color })
      .eq('name', partner.name);
    if (error) {
      console.error(`❌ Update error for ${partner.name}:`, error.message);
    } else {
      console.log(`✅ Updated: ${partner.name}`);
    }
  }
};

updatePartners().catch(console.error);
