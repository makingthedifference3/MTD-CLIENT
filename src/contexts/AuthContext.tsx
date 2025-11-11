import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { users, csrPartners, type User, type CSRPartner } from '../data/mockData';

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

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const storedUser = localStorage.getItem('csr_user');
      const storedPartner = localStorage.getItem('csr_partner');

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
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));

    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (!foundUser) {
      throw new Error('Invalid credentials');
    }

    const foundPartner = csrPartners.find(p => p.id === foundUser.csr_partner_id);
    
    if (!foundPartner) {
      throw new Error('Partner not found');
    }

    setUser(foundUser);
    setPartner(foundPartner);

    localStorage.setItem('csr_user', JSON.stringify(foundUser));
    localStorage.setItem('csr_partner', JSON.stringify(foundPartner));
  }

  async function logout() {
    setUser(null);
    setPartner(null);
    localStorage.removeItem('csr_user');
    localStorage.removeItem('csr_partner');
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
