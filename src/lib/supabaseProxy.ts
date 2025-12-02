/**
 * Direct Supabase API calls using Fetch
 * No proxy needed - works directly
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export async function fetchWithCors(
  url: string,
  options: FetchOptions = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    ...options.headers
  };

  try {
    const fullUrl = `${SUPABASE_URL}/rest/v1${url}`;
    console.log('📡 Fetching:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: options.method || 'GET',
      headers,
      body: options.body
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * Find CSR Partner with credentials
 */
export async function findCSRPartner(pocName: string, password: string) {
  try {
    // Use exact filter without case-insensitive
    const url = `/csr_partners?select=*&contact_person=eq.${encodeURIComponent(pocName)}&poc_password=eq.${encodeURIComponent(password)}`;
    console.log('🔍 Looking for partner:', { pocName, password });
    
    const data = await fetchWithCors(url);
    console.log('✅ Partner response:', data);
    
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error finding partner:', error);
    return null;
  }
}

/**
 * Find Toll User with credentials
 */
export async function findTollUser(pocName: string, password: string) {
  try {
    // Use exact filter without case-insensitive
    const url = `/csr_partner_tolls?select=*,csr_partners(*)&poc_name=eq.${encodeURIComponent(pocName)}&poc_password=eq.${encodeURIComponent(password)}`;
    console.log('🔍 Looking for toll user:', { pocName, password });
    
    const data = await fetchWithCors(url);
    console.log('✅ Toll response:', data);
    
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error finding toll user:', error);
    return null;
  }
}
