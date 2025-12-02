import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SUPABASE_URL = 'https://jklmwtaylfvebbemtttt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprbG13dGF5bGZ2ZWJiZW10dHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2Mjk1NzEsImV4cCI6MjA3ODIwNTU3MX0.7-G92eakM2iFI0VNdy3dEUiM33w9RLnGtbwOTzebYpA';

// CSR Partners Auth Endpoint
app.get('/api/auth/partner', async (req, res) => {
  try {
    const { contact_person, poc_password } = req.query;
    
    console.log('📝 Partner login attempt:', { contact_person, poc_password });

    if (!contact_person || !poc_password) {
      console.error('❌ Missing credentials');
      return res.status(400).json({ error: 'Missing contact_person or poc_password' });
    }

    const encodedName = contact_person.trim();
    const encodedPass = poc_password.trim();

    const url = `${SUPABASE_URL}/rest/v1/csr_partners?select=*&contact_person=ilike.${encodeURIComponent(encodedName)}&poc_password=eq.${encodeURIComponent(encodedPass)}`;

    console.log('🔍 Supabase URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ Supabase response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Supabase HTTP error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Supabase error: ${response.status}`,
        details: errorText 
      });
    }

    const data = await response.json();
    console.log('✅ Data received from Supabase:', data.length, 'records');
    res.json(data);
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
});

// Toll Users Auth Endpoint
app.get('/api/auth/toll', async (req, res) => {
  try {
    const { poc_name, poc_password } = req.query;
    
    console.log('📝 Toll login attempt:', { poc_name, poc_password });

    if (!poc_name || !poc_password) {
      console.error('❌ Missing credentials');
      return res.status(400).json({ error: 'Missing poc_name or poc_password' });
    }

    const encodedName = poc_name.trim();
    const encodedPass = poc_password.trim();

    const url = `${SUPABASE_URL}/rest/v1/csr_partner_tolls?select=*,csr_partners(*)&poc_name=ilike.${encodeURIComponent(encodedName)}&poc_password=eq.${encodeURIComponent(encodedPass)}`;

    console.log('🔍 Supabase URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ Supabase response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Supabase HTTP error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Supabase error: ${response.status}`,
        details: errorText 
      });
    }

    const data = await response.json();
    console.log('✅ Data received from Supabase:', data.length, 'records');
    res.json(data);
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📡 CORS enabled for all origins`);
  console.log(`🔐 Connected to Supabase\n`);
});
