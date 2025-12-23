import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { findCSRPartner, findTollUser } from '../lib/supabaseProxy';
import { useAuth } from '../contexts/AuthContext';
import type { User, CSRPartner } from '../types/csr';

export default function AuthBridge() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const establishSession = async () => {
      try {
        // Get credentials from URL query parameters
        // 'user' comes as plain text, 'pass' comes as Base64 encoded
        const username = searchParams.get('user');
        const encodedPass = searchParams.get('pass');

        if (!username || !encodedPass) {
          setStatus('error');
          setErrorMessage('Missing authentication credentials');
          return;
        }

        // Decode only the password (user is already plain text)
        const password = atob(encodedPass);

        // Debug log to help troubleshoot
        console.log(`Searching for Partner: Name='${username}' Pass='${password}'`);

        // Query csr_partners table to find matching credentials (Main Partner)
        const partnerData = await findCSRPartner(username, password);

        if (partnerData) {
          // Main Partner found - handle as before
          const loggedInUser: User = {
            id: partnerData.id,
            full_name: partnerData.contact_person || username,
            role: 'client',
            csr_partner_id: partnerData.id,
            email: partnerData.email
          };

          const loggedInPartner: CSRPartner = {
            id: partnerData.id,
            name: partnerData.name,
            company_name: partnerData.company_name || partnerData.name,
            website: partnerData.website,
            primary_color: partnerData.primary_color
          };

          // Use AuthContext to set auth data (updates state + localStorage)
          setAuthData(loggedInUser, loggedInPartner);
        } else {
          // No main partner found, try searching csr_partner_tolls (Sub-companies)
          console.log('No main partner found, searching toll users...');
          const tollData = await findTollUser(username, password);

          if (!tollData) {
            setStatus('error');
            setErrorMessage('Unauthorized Access');
            return;
          }

          // Toll user found - create user and partner objects with toll data
          const loggedInUser: User = {
            id: tollData.id,
            full_name: tollData.poc_name || username,
            role: 'client',
            csr_partner_id: tollData.csr_partner_id,
            toll_id: tollData.id,
            email: tollData.email_id
          };

          const loggedInPartner: CSRPartner = {
            id: tollData.csr_partner_id,
            name: tollData.toll_name,
            company_name: tollData.toll_name,
            website: tollData.csr_partners?.website,
            primary_color: tollData.csr_partners?.primary_color,
            toll_id: tollData.id,
            toll_name: tollData.toll_name
          };

          // Save toll data to localStorage with is_toll flag
          localStorage.setItem('is_toll', 'true');
          localStorage.setItem('toll_data', JSON.stringify({
            id: tollData.id,
            toll_name: tollData.toll_name,
            poc_name: tollData.poc_name,
            csr_partner_id: tollData.csr_partner_id,
            state: tollData.state
          }));

          // Use AuthContext to set auth data (updates state + localStorage)
          setAuthData(loggedInUser, loggedInPartner);
        }

        // Clear credentials from URL for security
        window.history.replaceState({}, document.title, '/auth-bridge');

        // Navigate to dashboard after successful authentication
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Authentication error:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
      }
    };

    establishSession();
  }, [searchParams, navigate]);

  if (status === 'error') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">
            Authentication Error
          </div>
          <div className="text-slate-600">{errorMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
        <div className="text-slate-700 text-lg font-medium">
          Syncing secure session...
        </div>
        <div className="text-slate-500 text-sm mt-2">
          Please wait while we authenticate you
        </div>
      </div>
    </div>
  );
}
