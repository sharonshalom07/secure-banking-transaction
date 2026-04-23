import { useState } from 'react';
import { User } from '../types';
import { apiUpdateProfile } from '../utils/api';

interface ProfilePageProps {
  user: User;
  onUpdate: () => void;
}

export default function ProfilePage({ user, onUpdate }: ProfilePageProps) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await apiUpdateProfile({
        full_name: fullName,
        email,
        phone,
      });
      setSuccess(result.message);
      setTimeout(() => {
        onUpdate();
        setSuccess('');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const initials = (user.fullName || user.username).split(' ').map((w) => w.charAt(0).toUpperCase()).join('').slice(0, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-slide-up">
      {/* Profile Header */}
      <div className="glass-card-elevated" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24, margin: '0 auto 16px',
          background: 'var(--gradient-main)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 800, color: 'white',
          boxShadow: '0 8px 30px rgba(6, 182, 212, 0.25)',
        }}>
          {initials}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
          {user.fullName || user.username}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>@{user.username}</p>

        {/* Account Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 24 }}>
          <div style={{ padding: 16, borderRadius: 14, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Account Number</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>{user.accountNumber}</p>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>IFSC Code</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-purple)', fontFamily: 'monospace' }}>{user.ifscCode}</p>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Bank</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-emerald)' }}>{user.bankName}</p>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Balance</p>
            <p style={{ fontSize: 14, fontWeight: 700 }} className="text-gradient">
              ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="glass-card-elevated" style={{ padding: 28 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Edit Profile</h3>

        <div style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="glass-input" placeholder="Enter your full name" id="profile-name" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input" placeholder="you@email.com" id="profile-email" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="glass-input" placeholder="+91 XXXXXXXXXX" id="profile-phone" />
            </div>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 14 }}><span>{error}</span></div>}
          {success && <div className="alert alert-success" style={{ marginBottom: 14 }}><span>{success}</span></div>}

          <button onClick={handleUpdate} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <><span className="spinner" /><span>Saving...</span></> : <span>Update Profile</span>}
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="glass-card-elevated" style={{ padding: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          🔐 Your account is secured with RSA-2048 encryption, bcrypt password hashing, and JWT session tokens. Account number and IFSC code are required for receiving fund transfers.
        </p>
      </div>
    </div>
  );
}
