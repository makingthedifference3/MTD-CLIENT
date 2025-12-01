import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Portal from './components/Portal';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return user ? <Portal /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

// src/contexts/AuthContext.tsx
