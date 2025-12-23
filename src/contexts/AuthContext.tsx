import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, CSRPartner } from '../types/csr';
import { findCSRPartner, findTollUser } from '../lib/supabaseProxy';

interface AuthContextType {
  user: User | null;
  partner: CSRPartner | null;
  loading: boolean;
  login: (pocName: string, password: string) => Promise<void>;
  setAuthData: (user: User, partner: CSRPartner) => void;
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
      // Check localStorage for saved authentication
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

  async function login(pocName: string, password: string) {
    let loggedInUser: User | null = null;
    let loggedInPartner: CSRPartner | null = null;

    // 1. Try to find as Main Partner (contact_person)
    const partnerData = await findCSRPartner(pocName, password);

    if (partnerData) {
      // Main Partner Login
      loggedInUser = {
        id: partnerData.id,
        full_name: partnerData.contact_person || pocName,
        role: 'client',
        csr_partner_id: partnerData.id,
        email: partnerData.email
      };

      loggedInPartner = {
        id: partnerData.id,
        name: partnerData.name,
        company_name: partnerData.company_name || partnerData.name,
        website: partnerData.website,
        primary_color: partnerData.primary_color
      };

      // Clear toll flags for main partner login
      localStorage.removeItem('is_toll');
      localStorage.removeItem('toll_data');
    } else {
      // 2. If not found, try to find as Toll User
      const tollData = await findTollUser(pocName, password);

      if (tollData && tollData.csr_partners) {
        // Toll User Login
        const parentPartner = tollData.csr_partners; // This is an object because of the join

        loggedInUser = {
          id: tollData.id,
          full_name: tollData.poc_name,
          role: 'client',
          csr_partner_id: tollData.csr_partner_id,
          email: tollData.email_id,
          toll_id: tollData.id
        };

        loggedInPartner = {
          id: parentPartner.id,
          name: parentPartner.name,
          company_name: parentPartner.company_name || parentPartner.name,
          website: parentPartner.website,
          primary_color: parentPartner.primary_color,
          toll_id: tollData.id,
          toll_name: tollData.toll_name
        };

        // Save toll-specific flags to localStorage
        localStorage.setItem('is_toll', 'true');
        localStorage.setItem('toll_data', JSON.stringify({
          id: tollData.id,
          toll_name: tollData.toll_name,
          poc_name: tollData.poc_name,
          csr_partner_id: tollData.csr_partner_id,
          state: tollData.state
        }));
      }
    }

    if (!loggedInUser || !loggedInPartner) {
      throw new Error('Invalid credentials. Please check POC Name and Password.');
    }

    // Save to state and local storage
    setUser(loggedInUser);
    setPartner(loggedInPartner);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
    localStorage.setItem(PARTNER_STORAGE_KEY, JSON.stringify(loggedInPartner));
  }

  function setAuthData(loggedInUser: User, loggedInPartner: CSRPartner) {
    // Update state immediately
    setUser(loggedInUser);
    setPartner(loggedInPartner);
    // Persist to localStorage
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
    localStorage.setItem(PARTNER_STORAGE_KEY, JSON.stringify(loggedInPartner));
  }

  async function logout() {
    setUser(null);
    setPartner(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(PARTNER_STORAGE_KEY);
    localStorage.removeItem('is_toll');
    localStorage.removeItem('toll_data');
  }

  return (
    <AuthContext.Provider value={{ user, partner, loading, login, setAuthData, logout }}>
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
