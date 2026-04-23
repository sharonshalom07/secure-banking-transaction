import { useState } from 'react';
import { RSAKeyPair, DiffieHellman } from '../utils/crypto';
import { Session } from '../types';
import { apiRegister, apiLogin } from '../utils/api';
import PasswordStrength from './PasswordStrength';

interface AuthPageProps {
  onLogin: (session: Session) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (!username || !password) {
        setError('Username and password are required');
        setLoading(false);
        return;
      }

      if (username.length < 3) {
        setError('Username must be at least 3 characters');
        setLoading(false);
        return;
      }

      if (!fullName.trim()) {
        setError('Full name is required');
        setLoading(false);
        return;
      }

      // Generate RSA key pair for digital signatures
      const rsaKeys = new RSAKeyPair();

      // Register via API (password strength validated server-side)
      const result = await apiRegister({
        username,
        password,
        full_name: fullName,
        email,
        phone,
        public_key: rsaKeys.publicKey,
        private_key: rsaKeys.privateKey,
      });

      setSuccessMsg(`Registration successful! Account: ${result.account_number}`);
      setTimeout(() => {
        setIsLogin(true);
        setPassword('');
        setSuccessMsg('');
      }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (!username || !password) {
        setError('Username and password are required');
        setLoading(false);
        return;
      }

      // Login via API — returns JWT token
      const result = await apiLogin({ username, password });

      // Perform Diffie-Hellman key exchange (simulated client-server)
      const clientDH = new DiffieHellman();
      const serverDH = new DiffieHellman();
      const sessionKey = clientDH.computeSharedSecret(serverDH.publicKey);

      // Fetch user profile to get keys
      const { apiGetProfile } = await import('../utils/api');
      const profile = await apiGetProfile();

      // Create session
      const session: Session = {
        username: result.username,
        token: result.access_token,
        sessionKey,
        publicKey: profile.public_key,
        privateKey: profile.private_key,
        dhPublicKey: clientDH.getPublicKey(),
      };

      onLogin(session);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 16, position: 'relative' }}>
      {/* Background Orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }} className="animate-slide-up">
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, margin: '0 auto 16px',
            borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gradient-main)',
            boxShadow: '0 8px 30px rgba(6, 182, 212, 0.3)',
          }} className="animate-pulse-glow">
            <svg width="36" height="36" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span className="text-gradient">SecureBank</span>
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>
            Multi-Layer Encrypted Banking System
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card-elevated" style={{ padding: 32 }}>
          {/* Tab Toggle */}
          <div style={{
            display: 'flex', borderRadius: 12, padding: 4,
            background: 'var(--bg-tab)', marginBottom: 28,
            border: '1px solid var(--border-glass)',
          }}>
            <button
              onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                fontFamily: 'Inter, sans-serif',
                background: isLogin ? 'var(--gradient-main)' : 'transparent',
                color: isLogin ? 'white' : 'var(--text-muted)',
                boxShadow: isLogin ? '0 4px 12px rgba(6,182,212,0.25)' : 'none',
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                fontFamily: 'Inter, sans-serif',
                background: !isLogin ? 'var(--gradient-main)' : 'transparent',
                color: !isLogin ? 'white' : 'var(--text-muted)',
                boxShadow: !isLogin ? '0 4px 12px rgba(6,182,212,0.25)' : 'none',
              }}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <div className="stagger-children">
            {/* Registration-only fields */}
            {!isLogin && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="glass-input"
                    placeholder="Enter your full name"
                    id="auth-fullname"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input"
                      placeholder="you@email.com"
                      id="auth-email"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="glass-input"
                      placeholder="+91 XXXXXXXXXX"
                      id="auth-phone"
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-input"
                placeholder="Enter your username"
                id="auth-username"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      isLogin ? handleLogin() : handleRegister();
                    }
                  }}
                  className="glass-input"
                  style={{ paddingRight: 48 }}
                  placeholder="Enter your password"
                  id="auth-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: 'var(--text-muted)', transition: 'color 0.2s',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Strength Meter (Registration only) */}
              {!isLogin && <PasswordStrength password={password} />}
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success */}
            {successMsg && (
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={isLogin ? handleLogin : handleRegister}
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              id="auth-submit"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </div>

          {/* Security Badge (Registration) */}
          {!isLogin && (
            <div style={{
              marginTop: 24, padding: 16, borderRadius: 12,
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.15)',
            }} className="animate-fade-in">
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Security Features
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {['SHA-256 Hashing', 'RSA-2048 Keys', 'DH Key Exchange', 'AES Encryption', 'bcrypt Storage', 'JWT Sessions'].map((f) => (
                  <span key={f} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: 'var(--accent-emerald)' }}>✓</span> {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
