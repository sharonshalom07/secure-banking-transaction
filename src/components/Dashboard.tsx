import { useState, useEffect } from 'react';
import { Session, User, Transaction } from '../types';
import { apiGetProfile, apiGetTransactions, apiLogout, apiGetSummary, apiGetMiniStatement, AccountSummary, TransactionRecord } from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import TransactionForm from './TransactionForm';
import TransactionHistory from './TransactionHistory';
import SecurityInfo from './SecurityInfo';
import BillPayment from './BillPayment';
import BeneficiaryManager from './BeneficiaryManager';
import ProfilePage from './ProfilePage';

interface DashboardProps {
  session: Session;
  onLogout: () => void;
}

type TabId = 'home' | 'transfer' | 'bills' | 'beneficiaries' | 'history' | 'profile' | 'security';

export default function Dashboard({ session, onLogout }: DashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [miniStatement, setMiniStatement] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const mapTransaction = (t: TransactionRecord): Transaction => ({
    id: t.transaction_id, from: t.from_user, to: t.to_user,
    fromAccount: t.from_account, toAccount: t.to_account,
    amount: t.amount, timestamp: t.timestamp,
    encryptedData: t.encrypted_data, signature: t.signature,
    verified: t.verified, description: t.description,
    transactionType: t.transaction_type,
  });

  const loadData = async () => {
    try {
      const [profile, txns, sum, mini] = await Promise.all([
        apiGetProfile(), apiGetTransactions(), apiGetSummary(), apiGetMiniStatement(),
      ]);
      setUser({
        username: profile.username,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        passwordHash: '',
        publicKey: profile.public_key,
        privateKey: profile.private_key,
        balance: profile.balance,
        accountNumber: profile.account_number,
        ifscCode: profile.ifsc_code,
        bankName: profile.bank_name,
      });
      setTransactions(txns.map(mapTransaction));
      setMiniStatement(mini.map(mapTransaction));
      setSummary(sum);
    } catch { onLogout(); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => { try { await apiLogout(); } finally { onLogout(); } };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'home', label: 'Dashboard', icon: '🏠' },
    { id: 'transfer', label: 'Transfer', icon: '↔' },
    { id: 'bills', label: 'Pay Bills', icon: '💳' },
    { id: 'beneficiaries', label: 'Beneficiaries', icon: '👤' },
    { id: 'history', label: 'History', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🛡️' },
  ];

  const initials = (user.fullName || user.username).split(' ').map((w) => w.charAt(0).toUpperCase()).join('').slice(0, 2);

  const fmt = (ts: number) => ts ? new Date(ts).toLocaleString() : 'N/A';

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="bg-orbs"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--header-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-glass)', transition: 'background 0.3s ease' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(6,182,212,0.25)' }}>
              <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700 }} className="text-gradient">SecureBank</h1>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Encrypted Banking System</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="theme-toggle" id="theme-toggle" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* User Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setActiveTab('profile')}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--gradient-main)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'white',
              }}>
                {initials}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.fullName || user.username}</p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{user.accountNumber}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} id="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 48px', position: 'relative', zIndex: 1 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 16, background: 'var(--bg-tab)', border: '1px solid var(--border-glass)', flexWrap: 'wrap', marginBottom: 24 }} className="animate-fade-in">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} id={`tab-${tab.id}`}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in" key={activeTab}>
          {/* ===== HOME / DASHBOARD ===== */}
          {activeTab === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Balance Card */}
              <div className="animate-slide-up" style={{ borderRadius: 24, padding: 28, position: 'relative', overflow: 'hidden', background: 'var(--balance-card-bg)', border: `1px solid var(--balance-card-border)`, backdropFilter: 'blur(20px)' }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(6,182,212,0.1)' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 20 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Available Balance</p>
                    <p style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em' }} className="text-gradient">${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>📇 {user.accountNumber}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>🏦 {user.ifscCode}</p>
                    </div>
                  </div>
                  {summary && (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Total Sent', val: `$${summary.total_sent.toLocaleString()}`, color: 'var(--accent-rose)' },
                        { label: 'Total Received', val: `$${summary.total_received.toLocaleString()}`, color: 'var(--accent-emerald)' },
                        { label: 'Transactions', val: summary.transaction_count.toString(), color: 'var(--accent-cyan)' },
                      ].map((s) => (
                        <div key={s.label} style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--stat-bg)', border: '1px solid var(--border-glass)', minWidth: 110 }}>
                          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.val}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Transfer Funds', icon: '↔', tab: 'transfer' as TabId, color: 'var(--accent-cyan)' },
                    { label: 'Pay Bills', icon: '💳', tab: 'bills' as TabId, color: 'var(--accent-purple)' },
                    { label: 'Beneficiaries', icon: '👤', tab: 'beneficiaries' as TabId, color: 'var(--accent-emerald)' },
                    { label: 'Transaction History', icon: '📋', tab: 'history' as TabId, color: 'var(--accent-amber)' },
                    { label: 'My Profile', icon: '⚙️', tab: 'profile' as TabId, color: 'var(--accent-blue)' },
                    { label: 'Security', icon: '🛡️', tab: 'security' as TabId, color: 'var(--accent-rose)' },
                  ].map((action) => (
                    <div key={action.label} className="quick-action" onClick={() => setActiveTab(action.tab)}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{action.icon}</div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{action.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini Statement */}
              <div className="glass-card-elevated animate-slide-up" style={{ overflow: 'hidden', animationDelay: '0.2s' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-item)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Transactions</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Last {miniStatement.length} transactions</p>
                  </div>
                  <button onClick={() => setActiveTab('history')} className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
                    View All →
                  </button>
                </div>

                {miniStatement.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No transactions yet</p>
                  </div>
                ) : (
                  <div>
                    {miniStatement.map((t) => {
                      const isSent = t.from === user.username;
                      const isBill = t.transactionType === 'bill_payment';
                      const label = isBill
                        ? t.description || `Bill Payment`
                        : isSent
                          ? `Transfer to ${t.to}`
                          : `From ${t.from}`;

                      return (
                        <div key={t.id} style={{
                          padding: '12px 24px', borderBottom: '1px solid var(--border-item)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                              background: isBill ? 'rgba(139,92,246,0.12)' : isSent ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                            }}>
                              {isBill ? '💳' : isSent ? '↗' : '↙'}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
                              <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmt(t.timestamp)}</p>
                            </div>
                          </div>
                          <p style={{ fontSize: 15, fontWeight: 700, flexShrink: 0, color: isSent || isBill ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                            {isSent || isBill ? '-' : '+'}${t.amount.toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== TRANSFER ===== */}
          {activeTab === 'transfer' && (
            <TransactionForm session={session} currentUser={user} onSuccess={loadData} />
          )}

          {/* ===== PAY BILLS ===== */}
          {activeTab === 'bills' && (
            <BillPayment currentUser={user} onSuccess={loadData} />
          )}

          {/* ===== BENEFICIARIES ===== */}
          {activeTab === 'beneficiaries' && (
            <BeneficiaryManager />
          )}

          {/* ===== HISTORY ===== */}
          {activeTab === 'history' && (
            <TransactionHistory transactions={transactions} session={session} currentUsername={user.username} />
          )}

          {/* ===== PROFILE ===== */}
          {activeTab === 'profile' && (
            <ProfilePage user={user} onUpdate={loadData} />
          )}

          {/* ===== SECURITY ===== */}
          {activeTab === 'security' && (
            <SecurityInfo session={session} user={user} />
          )}
        </div>
      </main>
    </div>
  );
}
