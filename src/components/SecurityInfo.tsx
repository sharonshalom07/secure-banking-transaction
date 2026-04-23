import { Session, User } from '../types';
import { useState, useEffect } from 'react';
import { apiChangePassword, apiGetAuditLogs, apiHealthCheck, AuditLogRecord, HealthStatus } from '../utils/api';
import PasswordStrength from './PasswordStrength';

interface SecurityInfoProps {
  session: Session;
  user: User;
}

export default function SecurityInfo({ session, user }: SecurityInfoProps) {
  const [copiedField, setCopiedField] = useState('');
  const [activeSection, setActiveSection] = useState<'overview' | 'password' | 'audit' | 'health'>('overview');

  // Change Password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Health state
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  useEffect(() => {
    if (activeSection === 'audit') loadAuditLogs();
    if (activeSection === 'health') loadHealth();
  }, [activeSection]);

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const logs = await apiGetAuditLogs();
      setAuditLogs(logs);
    } catch { /* ignore */ }
    finally { setAuditLoading(false); }
  };

  const loadHealth = async () => {
    try {
      const h = await apiHealthCheck();
      setHealth(h);
    } catch { /* ignore */ }
  };

  const handleChangePassword = async () => {
    setPwdLoading(true); setPwdErr(''); setPwdMsg('');
    try {
      const res = await apiChangePassword({ current_password: currentPwd, new_password: newPwd });
      setPwdMsg(res.message);
      setCurrentPwd(''); setNewPwd('');
    } catch (e: unknown) {
      setPwdErr(e instanceof Error ? e.message : 'Failed');
    } finally { setPwdLoading(false); }
  };

  const cards = [
    { title: 'Authentication', desc: 'bcrypt password hashing with SHA-256.', algo: 'bcrypt + SHA-256', detail: 'Hash Length: 256 bits', color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    { title: 'Key Exchange', desc: 'Diffie-Hellman establishes secure session key.', algo: 'Diffie-Hellman', detail: 'Session Active', color: 'var(--accent-cyan)', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)' },
    { title: 'Encryption', desc: 'AES encrypts all transaction data.', algo: 'AES-256', detail: 'Mode: CBC', color: 'var(--accent-purple)', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
    { title: 'Digital Signature', desc: 'RSA signatures for non-repudiation.', algo: 'RSA-2048', detail: 'Padding: PKCS#1', color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  ];

  const sections = [
    { id: 'overview' as const, label: '🛡️ Overview' },
    { id: 'password' as const, label: '🔑 Change Password' },
    { id: 'audit' as const, label: '📋 Audit Logs' },
    { id: 'health' as const, label: '💚 Health' },
  ];

  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <button onClick={() => copyToClipboard(text, field)} style={{ fontSize: 11, color: copiedField === field ? 'var(--accent-emerald)' : 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
      {copiedField === field ? '✓ Copied' : 'Copy'}
    </button>
  );

  const eventColors: Record<string, string> = {
    LOGIN_SUCCESS: 'var(--accent-emerald)',
    LOGIN_FAILED: 'var(--accent-rose)',
    REGISTER: 'var(--accent-cyan)',
    TRANSFER: 'var(--accent-purple)',
    PASSWORD_CHANGE: 'var(--accent-amber)',
    LOGOUT: 'var(--text-muted)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-slide-up">
      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
        {sections.map((s) => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} className={`tab-btn ${activeSection === s.id ? 'active' : ''}`} style={{ fontSize: 13 }}>{s.label}</button>
        ))}
      </div>

      {/* === OVERVIEW === */}
      {activeSection === 'overview' && (
        <>
          <div className="glass-card-elevated" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Security Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {cards.map((c) => (
                <div key={c.title} style={{ padding: 20, borderRadius: 14, background: c.bg, border: `1px solid ${c.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: c.color }}>{c.title}</h3>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" fill="white" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{c.desc}</p>
                  <div style={{ padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                    <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{c.algo}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session & Keys */}
          <div className="glass-card-elevated" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Session & Keys</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'DH Public Key', val: session.dhPublicKey, field: 'dh', trunc: 80 },
                { label: 'Session Key (SHA-256)', val: session.sessionKey, field: 'sk', trunc: 0 },
                { label: 'RSA Public Key', val: user.publicKey, field: 'pub', trunc: 150 },
              ].map((k) => (
                <div key={k.field} style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{k.label}</span>
                    <CopyBtn text={k.val} field={k.field} />
                  </div>
                  <p style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    {k.val ? (k.trunc ? k.val.substring(0, k.trunc) + '...' : k.val) : 'N/A'}
                  </p>
                </div>
              ))}
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-rose)' }}>🔒 RSA Private Key (Secret)</span>
                <p style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--accent-rose)', wordBreak: 'break-all', marginTop: 6, opacity: 0.7 }}>{user.privateKey ? user.privateKey.substring(0, 80) + '... [HIDDEN]' : 'N/A'}</p>
                <p style={{ fontSize: 10, color: 'var(--accent-rose)', marginTop: 6, opacity: 0.8 }}>⚠️ Never share your private key.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === CHANGE PASSWORD === */}
      {activeSection === 'password' && (
        <div className="glass-card-elevated" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Change Password</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>CIA: Confidentiality — Update your password with bcrypt re-hashing</p>

          <div style={{ maxWidth: 440 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Current Password</label>
              <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className="glass-input" placeholder="Enter current password" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>New Password</label>
              <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="glass-input" placeholder="Enter new password" />
              <PasswordStrength password={newPwd} />
            </div>

            {pwdErr && <div className="alert alert-error" style={{ marginBottom: 14 }}><span>{pwdErr}</span></div>}
            {pwdMsg && <div className="alert alert-success" style={{ marginBottom: 14 }}><span>{pwdMsg}</span></div>}

            <button onClick={handleChangePassword} disabled={pwdLoading || !currentPwd || !newPwd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {pwdLoading ? <><span className="spinner" /><span>Changing...</span></> : <span>Change Password</span>}
            </button>
          </div>
        </div>
      )}

      {/* === AUDIT LOGS === */}
      {activeSection === 'audit' && (
        <div className="glass-card-elevated" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Audit Logs</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>CIA: Integrity — Immutable record of all security events</p>
            </div>
            <button onClick={loadAuditLogs} className="btn-ghost" style={{ fontSize: 12 }}>↻ Refresh</button>
          </div>

          {auditLoading ? (
            <div style={{ textAlign: 'center', padding: 32 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
          ) : auditLogs.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32, fontSize: 14 }}>No audit logs yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {auditLogs.map((log, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: log.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                        background: `${eventColors[log.event_type] || 'var(--text-muted)'}20`,
                        color: eventColors[log.event_type] || 'var(--text-muted)',
                      }}>{log.event_type}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.details}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.ip_address}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === HEALTH CHECK === */}
      {activeSection === 'health' && (
        <div className="glass-card-elevated" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>System Health</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>CIA: Availability — Real-time system status monitoring</p>

          {health ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ padding: 20, borderRadius: 14, background: health.status === 'healthy' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', border: `1px solid ${health.status === 'healthy' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}` }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Status</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: health.status === 'healthy' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {health.status === 'healthy' ? '✓ Healthy' : '✗ Unhealthy'}
                </p>
              </div>
              <div style={{ padding: 20, borderRadius: 14, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Database</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-cyan)' }}>{health.database === 'connected' ? '✓ Connected' : '✗ Down'}</p>
              </div>
              <div style={{ padding: 20, borderRadius: 14, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Total Users</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-purple)' }}>{health.users}</p>
              </div>
              <div style={{ padding: 20, borderRadius: 14, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Total Transactions</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-amber)' }}>{health.transactions}</p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
          )}

          <button onClick={loadHealth} className="btn-ghost" style={{ marginTop: 16, fontSize: 12 }}>↻ Refresh</button>
        </div>
      )}
    </div>
  );
}
