import { Transaction, Session } from '../types';
import { decryptAES } from '../utils/crypto';
import { useState, useEffect, useMemo } from 'react';
import { apiExportCSV } from '../utils/api';

interface TransactionHistoryProps {
  transactions: Transaction[];
  session: Session;
  currentUsername: string;
}

export default function TransactionHistory({ transactions, session, currentUsername }: TransactionHistoryProps) {
  const [verified, setVerified] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received' | 'bills'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => { verifyAll(); }, [transactions]);

  const verifyAll = () => {
    const result = transactions.map((t) => {
      try {
        if (session.sessionKey && t.encryptedData) {
          const dec = decryptAES(t.encryptedData, session.sessionKey);
          JSON.parse(dec);
        }
        return { ...t, verified: t.verified !== false };
      } catch { return { ...t, verified: t.verified || false }; }
    });
    setVerified(result);
  };

  const filtered = useMemo(() => {
    let list = verified;
    if (filter === 'sent') list = list.filter((t) => t.from === currentUsername && t.transactionType !== 'bill_payment');
    else if (filter === 'received') list = list.filter((t) => t.to === currentUsername && t.from !== currentUsername);
    else if (filter === 'bills') list = list.filter((t) => t.transactionType === 'bill_payment');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) =>
        (t.description || '').toLowerCase().includes(q) ||
        t.to.toLowerCase().includes(q) ||
        t.from.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }

    return list;
  }, [verified, filter, currentUsername, searchQuery]);

  const handleExport = async () => {
    setExporting(true);
    try { await apiExportCSV(); } catch { /* ignore */ }
    finally { setExporting(false); }
  };

  const fmt = (ts: number) => ts ? new Date(ts).toLocaleString() : 'N/A';

  // Stats
  const sentCount = verified.filter((t) => t.from === currentUsername && t.transactionType !== 'bill_payment').length;
  const recvCount = verified.filter((t) => t.to === currentUsername && t.from !== currentUsername).length;
  const billCount = verified.filter((t) => t.transactionType === 'bill_payment').length;

  if (verified.length === 0) {
    return (
      <div className="glass-card-elevated animate-slide-up" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28 }}>📋</span>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>No Transactions Yet</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Your transaction history will appear here</p>
      </div>
    );
  }

  return (
    <div className="glass-card-elevated animate-slide-up" style={{ overflow: 'hidden' }}>
      {/* Header with filters */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-item)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Transaction History</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} • {sentCount} sent • {recvCount} received • {billCount} bills
            </p>
          </div>
          <button onClick={handleExport} disabled={exporting} className="btn-ghost" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            {exporting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <span>📥</span>}
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ marginTop: 14 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input"
            placeholder="🔍 Search by description, name, or amount..."
            style={{ fontSize: 13, padding: '10px 14px' }}
            id="history-search"
          />
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12, padding: 3, borderRadius: 10, background: 'var(--bg-tab)', border: '1px solid var(--border-glass)' }}>
          {[
            { id: 'all' as const, label: `All (${verified.length})` },
            { id: 'sent' as const, label: `Sent (${sentCount})` },
            { id: 'received' as const, label: `Received (${recvCount})` },
            { id: 'bills' as const, label: `Bills (${billCount})` },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.3s',
              background: filter === f.id ? 'var(--gradient-main)' : 'transparent',
              color: filter === f.id ? 'white' : 'var(--text-muted)',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="stagger-children">
        {filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No transactions match your filter</p>
          </div>
        ) : filtered.map((t) => {
          const isSent = t.from === currentUsername;
          const isBill = t.transactionType === 'bill_payment';
          const label = isBill
            ? t.description || `Bill Payment to ${t.to}`
            : isSent
              ? `Transfer to ${t.to}`
              : `Received from ${t.from}`;

          return (
            <div key={t.id} style={{
              padding: '16px 28px', borderBottom: '1px solid var(--border-item)',
              transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: isBill ? 'rgba(139,92,246,0.12)' : isSent ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)',
                  border: `1px solid ${isBill ? 'rgba(139,92,246,0.2)' : isSent ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {isBill ? '💳' : isSent ? '↗' : '↙'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                    {t.verified && (
                      <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald)', border: '1px solid rgba(16,185,129,0.25)' }}>✓</span>
                    )}
                    {isBill && (
                      <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.25)' }}>BILL</span>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{fmt(t.timestamp)}</p>
                  {t.description && !isBill && <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{t.description}</p>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: isSent || isBill ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                  {isSent || isBill ? '-' : '+'}${t.amount.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '14px 28px', borderTop: '1px solid var(--border-item)', background: 'var(--bg-hover)' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>🔐 Transactions are encrypted with AES-256 and signed with RSA-2048. Stored securely in MongoDB.</p>
      </div>
    </div>
  );
}
