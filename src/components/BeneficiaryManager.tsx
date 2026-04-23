import { useState, useEffect } from 'react';
import { Beneficiary } from '../types';
import { apiGetBeneficiaries, apiAddBeneficiary, apiDeleteBeneficiary } from '../utils/api';

interface BeneficiaryManagerProps {
  onSelect?: (ben: Beneficiary) => void;
  selectable?: boolean;
}

export default function BeneficiaryManager({ onSelect, selectable = false }: BeneficiaryManagerProps) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  // Add form state
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const loadBeneficiaries = async () => {
    setLoading(true);
    try {
      const bens = await apiGetBeneficiaries();
      setBeneficiaries(bens.map((b) => ({
        id: b.id,
        name: b.name,
        nickname: b.nickname,
        accountNumber: b.account_number,
        ifscCode: b.ifsc_code,
        bankName: b.bank_name,
        createdAt: b.created_at,
      })));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    setAddLoading(true);
    setAddError('');
    setAddSuccess('');

    try {
      if (!name.trim()) { setAddError('Beneficiary name is required'); setAddLoading(false); return; }
      if (!accountNumber.trim()) { setAddError('Account number is required'); setAddLoading(false); return; }
      if (!ifscCode.trim()) { setAddError('IFSC/Bank code is required'); setAddLoading(false); return; }

      const result = await apiAddBeneficiary({
        name: name.trim(),
        nickname: nickname.trim() || name.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
        bank_name: bankName.trim() || 'Unknown Bank',
      });

      setAddSuccess(result.message);
      setName(''); setNickname(''); setAccountNumber(''); setIfscCode(''); setBankName('');
      setTimeout(() => { setShowAdd(false); setAddSuccess(''); }, 1500);
      loadBeneficiaries();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add beneficiary');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteBeneficiary(id);
      setDeleteConfirm('');
      loadBeneficiaries();
    } catch { /* ignore */ }
  };

  const handleSelect = (ben: Beneficiary) => {
    if (!selectable) return;
    setSelectedId(ben.id);
    onSelect?.(ben);
  };

  return (
    <div className="glass-card-elevated animate-slide-up" style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            {selectable ? 'Select Beneficiary' : 'Manage Beneficiaries'}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {beneficiaries.length} saved beneficiar{beneficiaries.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-ghost" style={{ fontSize: 13 }}>
          {showAdd ? '✕ Cancel' : '+ Add New'}
        </button>
      </div>

      {/* Add Beneficiary Form */}
      {showAdd && (
        <div style={{ marginBottom: 24, padding: 20, borderRadius: 14, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }} className="animate-fade-in">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Add New Beneficiary</h3>

          <div style={{ display: 'grid', gap: 12, maxWidth: 500 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Full Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="glass-input" placeholder="Account holder name" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Nickname</label>
                <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="glass-input" placeholder="e.g. Mom, Rent..." />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Account Number *</label>
              <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="glass-input" placeholder="Enter account number" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>IFSC / Bank Code *</label>
                <input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} className="glass-input" placeholder="e.g. SECB0001234" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Bank Name</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="glass-input" placeholder="e.g. SecureBank" />
              </div>
            </div>

            {addError && <div className="alert alert-error"><span>{addError}</span></div>}
            {addSuccess && <div className="alert alert-success"><span>{addSuccess}</span></div>}

            <button onClick={handleAdd} disabled={addLoading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {addLoading ? <><span className="spinner" /><span>Saving...</span></> : <span>Save Beneficiary</span>}
            </button>
          </div>
        </div>
      )}

      {/* Beneficiary List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : beneficiaries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No beneficiaries saved yet</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Add a beneficiary to quickly transfer funds</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {beneficiaries.map((ben) => (
            <div
              key={ben.id}
              className={`beneficiary-item ${selectedId === ben.id ? 'selected' : ''}`}
              onClick={() => handleSelect(ben)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: 'var(--gradient-main)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: 'white',
                }}>
                  {ben.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{ben.nickname || ben.name}</span>
                    {ben.nickname && ben.nickname !== ben.name && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({ben.name})</span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                    {ben.accountNumber} • {ben.ifscCode}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ben.bankName}</p>
                </div>
              </div>

              {!selectable && (
                <div style={{ flexShrink: 0 }}>
                  {deleteConfirm === ben.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(ben.id); }} className="btn-danger" style={{ fontSize: 11, padding: '6px 12px' }}>
                        Confirm
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(''); }} className="btn-ghost" style={{ fontSize: 11, padding: '6px 12px' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(ben.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 4 }}
                      title="Delete beneficiary"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )}

              {selectable && selectedId === ben.id && (
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)' }}>
                    ✓ Selected
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
