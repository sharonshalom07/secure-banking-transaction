import { useState, useEffect } from 'react';
import { Session, User, Beneficiary } from '../types';
import { encryptAES, signData, generateTransactionId } from '../utils/crypto';
import { apiTransfer, apiGetBeneficiaries } from '../utils/api';

interface TransactionFormProps {
  session: Session;
  currentUser: User;
  onSuccess: () => void;
}

export default function TransactionForm({ session, currentUser, onSuccess }: TransactionFormProps) {
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Beneficiary quick-select
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);
  const [selectedBenName, setSelectedBenName] = useState('');

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const loadBeneficiaries = async () => {
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
  };

  const selectBeneficiary = (ben: Beneficiary) => {
    setAccountNumber(ben.accountNumber);
    setIfscCode(ben.ifscCode);
    setSelectedBenName(ben.nickname || ben.name);
    setShowBeneficiaries(false);
  };

  const handleTransfer = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!accountNumber.trim()) { setError('Recipient account number is required'); setLoading(false); return; }
      if (!ifscCode.trim()) { setError('IFSC/Bank code is required'); setLoading(false); return; }
      if (!amount) { setError('Amount is required'); setLoading(false); return; }

      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) { setError('Please enter a valid amount'); setLoading(false); return; }
      if (transferAmount > currentUser.balance) { setError('Insufficient balance'); setLoading(false); return; }
      if (!password) { setError('Password is required to confirm transfer'); setLoading(false); return; }

      const transactionId = generateTransactionId();
      const timestamp = Date.now();
      const transactionData = {
        id: transactionId,
        from: session.username,
        toAccount: accountNumber,
        amount: transferAmount,
        description: description || 'Fund Transfer',
        timestamp,
      };

      // RSA Digital Signature
      const dataToSign = JSON.stringify({
        from: transactionData.from,
        toAccount: transactionData.toAccount,
        amount: transactionData.amount,
        timestamp: transactionData.timestamp,
      });
      const signature = signData(dataToSign, session.privateKey);

      // AES Encryption with DH session key
      const encryptedData = encryptAES(JSON.stringify(transactionData), session.sessionKey);

      // Send to backend
      const result = await apiTransfer({
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
        amount: transferAmount,
        description: description || 'Fund Transfer',
        password,
        encrypted_data: encryptedData,
        signature,
        timestamp,
      });

      setSuccess(result.message);
      setAccountNumber('');
      setIfscCode('');
      setAmount('');
      setDescription('');
      setPassword('');
      setSelectedBenName('');

      setTimeout(() => {
        onSuccess();
        setSuccess('');
      }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { n: '1', label: 'Password Verify', desc: 'Your identity is confirmed', c: 'var(--accent-emerald)' },
    { n: '2', label: 'AES Encryption', desc: 'Data encrypted with session key', c: 'var(--accent-cyan)' },
    { n: '3', label: 'RSA Signature', desc: 'Signed with your private key', c: 'var(--accent-purple)' },
    { n: '4', label: 'Secure Transfer', desc: 'Verified & stored in database', c: 'var(--accent-amber)' },
  ];

  return (
    <div className="glass-card-elevated animate-slide-up" style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Transfer Funds</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Send money securely using account number & bank details
        </p>
      </div>

      {/* Beneficiary Quick Select */}
      {beneficiaries.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setShowBeneficiaries(!showBeneficiaries)}
            className="btn-ghost"
            style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
          >
            <span>👤</span>
            <span>{showBeneficiaries ? 'Hide Beneficiaries' : `Select from ${beneficiaries.length} Saved Beneficiar${beneficiaries.length > 1 ? 'ies' : 'y'}`}</span>
          </button>

          {showBeneficiaries && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }} className="animate-fade-in">
              {beneficiaries.map((ben) => (
                <div
                  key={ben.id}
                  onClick={() => selectBeneficiary(ben)}
                  className="beneficiary-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: 'var(--gradient-main)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: 'white',
                    }}>
                      {ben.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ben.nickname || ben.name}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ben.accountNumber} • {ben.ifscCode}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>Select →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Beneficiary Badge */}
      {selectedBenName && (
        <div style={{ marginBottom: 16, padding: 10, borderRadius: 10, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="animate-fade-in">
          <span style={{ fontSize: 13, color: 'var(--accent-cyan)' }}>✓ Sending to: <strong>{selectedBenName}</strong></span>
          <button onClick={() => { setSelectedBenName(''); setAccountNumber(''); setIfscCode(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>✕</button>
        </div>
      )}

      <div className="stagger-children">
        {/* Account Number */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
            Recipient Account Number *
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => { setAccountNumber(e.target.value); setSelectedBenName(''); }}
            className="glass-input"
            placeholder="e.g. ACC1234567890"
            id="transfer-account"
          />
        </div>

        {/* IFSC Code */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
            IFSC / Bank Code *
          </label>
          <input
            type="text"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
            className="glass-input"
            placeholder="e.g. SECB0001234"
            id="transfer-ifsc"
          />
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            Default IFSC for SecureBank accounts: SECB0001234
          </p>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
            Amount ($) *
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="glass-input"
            placeholder="0.00"
            step="0.01"
            min="0"
            id="transfer-amount"
          />
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            Available: ${currentUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
            Description / Remarks
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="glass-input"
            placeholder="e.g. Rent, Payment for..."
            id="transfer-description"
          />
        </div>

        {/* Password Confirmation */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
            🔒 Enter Password to Confirm *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTransfer(); }}
            className="glass-input"
            placeholder="Enter your login password"
            id="transfer-password"
          />
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <span>{success}</span>
          </div>
        )}

        <button onClick={handleTransfer} disabled={loading} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} id="transfer-submit">
          {loading ? (<><span className="spinner" /><span>Processing...</span></>) : (<><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg><span>Transfer Funds</span></>)}
        </button>
      </div>

      {/* Security Process */}
      <div style={{ marginTop: 28, padding: 20, borderRadius: 14, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 14 }}>🔐 Transaction Security</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {steps.map((s) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: `${s.c}20`, color: s.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{s.n}</div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}><strong>{s.label}</strong> — <span style={{ color: 'var(--text-muted)' }}>{s.desc}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
