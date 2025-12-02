export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const SUPABASE_URL = 'https://jklmwtaylfvebbemtttt.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprbG13dGF5bGZ2ZWJiZW10dHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2Mjk1NzEsImV4cCI6MjA3ODIwNTU3MX0.7-G92eakM2iFI0VNdy3dEUiM33w9RLnGtbwOTzebYpA';

  try {
    const { contact_person, poc_password } = req.query;

    if (!contact_person || !poc_password) {
      return res.status(400).json({ error: 'Missing contact_person or poc_password' });
    }

    const url = `${SUPABASE_URL}/rest/v1/csr_partners?select=*&contact_person=ilike.${encodeURIComponent(contact_person)}&poc_password=eq.${encodeURIComponent(poc_password)}`;

    console.log('🔍 Partner request:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Supabase error:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log('✅ Partner found:', data.length > 0 ? 'Yes' : 'No');
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Auth partner error:', error);
    res.status(500).json({ error: 'Auth request failed', details: error.message });
  }
}
