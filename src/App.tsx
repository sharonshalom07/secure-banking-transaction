import { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import { Session } from './types';
import { apiGetProfile, getToken, clearToken } from './utils/api';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const profile = await apiGetProfile();
      // Restore session from saved data
      const savedSession = localStorage.getItem('sb_session_data');
      let sessionData: Partial<Session> = {};
      if (savedSession) {
        try {
          sessionData = JSON.parse(savedSession);
        } catch {
          // ignore parse errors
        }
      }

      setSession({
        username: profile.username,
        token,
        sessionKey: sessionData.sessionKey || '',
        publicKey: profile.public_key,
        privateKey: profile.private_key,
        dhPublicKey: sessionData.dhPublicKey || '',
      });
    } catch {
      clearToken();
      localStorage.removeItem('sb_session_data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (newSession: Session) => {
    setSession(newSession);
    // Save DH data for session restoration
    localStorage.setItem('sb_session_data', JSON.stringify({
      sessionKey: newSession.sessionKey,
      dhPublicKey: newSession.dhPublicKey,
    }));
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem('sb_session_data');
    setSession(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading SecureBank...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return <Dashboard session={session} onLogout={handleLogout} />;
  }

  return <AuthPage onLogin={handleLogin} />;
}
