import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthBridge() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const establishSession = async () => {
      try {
        // Get tokens from URL query parameters
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
          setStatus('error');
          setErrorMessage('Missing authentication tokens');
          return;
        }

        // Set the Supabase session with the provided tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Session error:', error);
          setStatus('error');
          setErrorMessage(error.message);
          return;
        }

        if (data.session) {
          // Clear tokens from URL for security
          window.history.replaceState({}, document.title, '/auth-bridge');

          // Navigate to dashboard after successful session establishment
          navigate('/dashboard', { replace: true });
        } else {
          setStatus('error');
          setErrorMessage('Failed to establish session');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
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
