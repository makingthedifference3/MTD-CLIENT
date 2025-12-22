import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

export default function Login() {
  const [pocName, setPocName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(pocName, password);
      addToast('Login successful! Welcome back.', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-mtd-accent opacity-20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-mtd-primary opacity-20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-mtd-secondary opacity-20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>

      <div className="bg-card/80 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-md p-8 border border-border/50 relative z-10">
        <div className="text-center mb-10">
          {/* MTD NGO Logo */}
          <div className="mb-6 relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-mtd-primary to-mtd-secondary rounded-full opacity-25 group-hover:opacity-50 blur transition duration-1000 group-hover:duration-200"></div>
            <img 
              src="https://img.logo.dev/mtdngo.com?token=pk_TWFfI7LzSyOkJp3PACHx6A&format=png&size=200" 
              alt="Making the Difference NGO"
              className="relative mx-auto h-28 w-auto drop-shadow-md transform transition duration-500 hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div style={{ display: 'none' }} className="text-center">
              <div className="text-5xl font-black text-mtd-dark tracking-tighter">MTD</div>
              <div className="text-sm font-bold text-mtd-primary tracking-widest uppercase mt-1">Making the Difference</div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground font-medium">CSR Partner Portal Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="group">
              <label htmlFor="pocName" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 ml-1 group-focus-within:text-mtd-primary transition-colors">
                POC Name
              </label>
              <div className="relative">
                <input
                  id="pocName"
                  type="text"
                  value={pocName}
                  onChange={(e) => setPocName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-gray-400 focus:ring-2 focus:ring-mtd-primary/20 focus:border-mtd-primary transition-all outline-none font-medium"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 ml-1 group-focus-within:text-mtd-primary transition-colors">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl bg-muted/50 border border-border text-foreground placeholder-gray-400 focus:ring-2 focus:ring-mtd-primary/20 focus:border-mtd-primary transition-all outline-none font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-mtd-primary transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center animate-shake">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-mtd-primary to-mtd-secondary hover:from-mtd-dark hover:to-mtd-primary text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying Credentials...
              </>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Protected by secure encryption. <br/>
            © 2025 Making the Difference. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
