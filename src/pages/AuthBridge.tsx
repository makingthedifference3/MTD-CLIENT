import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { findCSRPartner } from '../lib/supabaseProxy';
import type { User, CSRPartner } from '../types/csr';

export default function AuthBridge() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const establishSession = async () => {
      try {
        // Get Base64 encoded credentials from URL query parameters
        const encodedUser = searchParams.get('user');
        const encodedPass = searchParams.get('pass');

        if (!encodedUser || !encodedPass) {
          setStatus('error');
          setErrorMessage('Missing authentication credentials');
          return;
        }

        // Decode the credentials
        const username = atob(encodedUser);
        const password = atob(encodedPass);

        // Query csr_partners table to find matching credentials
        const partnerData = await findCSRPartner(username, password);

        if (!partnerData) {
          setStatus('error');
          setErrorMessage('Unauthorized Access');
          return;
        }

        // Manually create user and partner objects
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

        // Save to localStorage (same keys used by AuthContext)
        localStorage.setItem('csr_user', JSON.stringify(loggedInUser));
        localStorage.setItem('csr_partner', JSON.stringify(loggedInPartner));

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
