import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, CSRPartner } from '../types/csr';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  partner: CSRPartner | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<CSRPartner | null>(null);
  const [loading, setLoading] = useState(true);

  const USER_STORAGE_KEY = 'csr_user';
  const PARTNER_STORAGE_KEY = 'csr_partner';

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const storedPartner = localStorage.getItem(PARTNER_STORAGE_KEY);

      if (storedUser && storedPartner) {
        setUser(JSON.parse(storedUser));
        setPartner(JSON.parse(storedPartner));
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (authError) {
      console.error('Supabase auth error during login:', authError);
      throw new Error(authError.message ?? 'Invalid credentials');
    }

    if (!authData.user) {
      throw new Error('Invalid credentials');
    }

    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role, csr_partner_id, username, auth_id')
      .eq('auth_id', authData.user.id)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user record:', userError);
      throw new Error(userError.message ?? 'Invalid credentials');
    }

    if (!dbUser) {
      throw new Error('User profile missing. Please contact support.');
    }

      if (!dbUser.csr_partner_id) {
        throw new Error('CSR partner is not linked to this user');
      }

      const { data: partnerRow, error: partnerError } = await supabase
        .from('csr_partners')
        .select('*')
        .eq('id', dbUser.csr_partner_id)
        .maybeSingle();

    if (partnerError || !partnerRow) {
      throw new Error('Partner not found for this user');
    }

    const sanitizedUser: User = {
      id: dbUser.id,
      email: dbUser.email,
      full_name: dbUser.full_name,
      role: dbUser.role,
      csr_partner_id: partnerRow.id,
    };

    const resolvedPartner: CSRPartner = {
      id: partnerRow.id,
      name: partnerRow.name ?? partnerRow.company_name ?? 'CSR Partner',
      company_name: partnerRow.company_name ?? partnerRow.name ?? 'CSR Partner',
      website: partnerRow.website ?? undefined,
      logo_url: partnerRow.logo_drive_link ?? undefined,
      primary_color: partnerRow.primary_color ?? '#2563eb',
    };

    setUser(sanitizedUser);
    setPartner(resolvedPartner);

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sanitizedUser));
    localStorage.setItem(PARTNER_STORAGE_KEY, JSON.stringify(resolvedPartner));
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Supabase sign out failed:', error);
    }
    setUser(null);
    setPartner(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(PARTNER_STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, partner, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
