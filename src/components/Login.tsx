import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('client@interise.com');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border-2 border-gray-200">
        <div className="text-center mb-8">
          {/* MTD NGO Logo */}
          <div className="mb-6">
            <img 
              src="https://img.logo.dev/mtdngo.com?token=pk_TWFfI7LzSyOkJp3PACHx6A&format=png&size=200" 
              alt="Making the Difference NGO"
              className="mx-auto h-24 w-auto"
              onError={(e) => {
                // Fallback to text if logo fails
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div style={{ display: 'none' }} className="text-center">
              <div className="text-4xl font-black text-gray-800">MTD</div>
              <div className="text-sm font-semibold text-gray-600">Making the Difference</div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">CSR Portal</h1>
          <p className="text-sm font-semibold text-gray-600 mb-1">Making the Difference NGO</p>
          <p className="text-gray-600 font-medium">Client Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white border-2 border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white border-2 border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
          <p className="font-semibold mb-2 text-sm text-gray-700">Demo Credentials:</p>
          <p className="font-medium">Email: <span className="text-gray-800">client@interise.com</span></p>
          <p className="font-medium">Password: <span className="text-gray-800">demo123</span></p>
        </div> */}
      </div>
    </div>
  );
}
