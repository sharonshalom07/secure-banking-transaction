import { useState } from 'react';
import { User } from '../types';
import { apiPayBill } from '../utils/api';

interface BillPaymentProps {
  currentUser: User;
  onSuccess: () => void;
}

const BILL_CATEGORIES = [
  { id: 'electricity', label: 'Electricity', icon: '⚡', color: '#f59e0b' },
  { id: 'water', label: 'Water', icon: '💧', color: '#06b6d4' },
  { id: 'gas', label: 'Gas', icon: '🔥', color: '#ef4444' },
  { id: 'internet', label: 'Internet', icon: '🌐', color: '#8b5cf6' },
  { id: 'credit_card', label: 'Credit Card', icon: '💳', color: '#3b82f6' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️', color: '#10b981' },
  { id: 'mobile', label: 'Mobile Recharge', icon: '📱', color: '#ec4899' },
  { id: 'dth', label: 'DTH / Cable', icon: '📺', color: '#6366f1' },
];

export default function BillPayment({ currentUser, onSuccess }: BillPaymentProps) {
  const [category, setCategory] = useState('');
  const [billerName, setBillerName] = useState('');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePayBill = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!category) { setError('Please select a bill category'); setLoading(false); return; }
      if (!billerName.trim()) { setError('Please enter the biller/provider name'); setLoading(false); return; }
      if (!consumerNumber.trim()) { setError('Please enter your consumer/account number'); setLoading(false); return; }

      const payAmount = parseFloat(amount);
      if (isNaN(payAmount) || payAmount <= 0) { setError('Please enter a valid amount'); setLoading(false); return; }
      if (payAmount > currentUser.balance) { setError('Insufficient balance'); setLoading(false); return; }
      if (!password) { setError('Password is required to confirm payment'); setLoading(false); return; }

      const result = await apiPayBill({
        category,
        biller_name: billerName,
        consumer_number: consumerNumber,
        amount: payAmount,
        password,
      });

      setSuccess(result.message);
      setCategory('');
      setBillerName('');
      setConsumerNumber('');
      setAmount('');
      setPassword('');

      setTimeout(() => {
        onSuccess();
        setSuccess('');
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = BILL_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="glass-card-elevated animate-slide-up" style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Pay Bills</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Pay your utility bills, recharge & more securely
        </p>
      </div>

      {/* Category Grid */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          Select Category
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
          {BILL_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={`bill-category ${category === cat.id ? 'selected' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</div>
              <p style={{ fontSize: 12, fontWeight: 600, color: category === cat.id ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                {cat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bill Details Form */}
      {category && (
        <div className="stagger-children" style={{ maxWidth: 480 }}>
          <div style={{ padding: 12, borderRadius: 10, background: `${selectedCat?.color}15`, border: `1px solid ${selectedCat?.color}30`, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{selectedCat?.icon}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedCat?.label}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Enter payment details below</p>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Biller / Provider Name
            </label>
            <input
              type="text"
              value={billerName}
              onChange={(e) => setBillerName(e.target.value)}
              className="glass-input"
              placeholder={`e.g. ${category === 'electricity' ? 'City Power Corp' : category === 'mobile' ? 'Jio, Airtel...' : 'Provider name'}`}
              id="bill-biller"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Consumer / Account Number
            </label>
            <input
              type="text"
              value={consumerNumber}
              onChange={(e) => setConsumerNumber(e.target.value)}
              className="glass-input"
              placeholder="Enter your consumer number"
              id="bill-consumer"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Amount ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass-input"
              placeholder="0.00"
              step="0.01"
              min="0"
              id="bill-amount"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              🔒 Enter Password to Confirm
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              placeholder="Enter your login password"
              id="bill-password"
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

          <button
            onClick={handlePayBill}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            id="bill-submit"
          >
            {loading ? (
              <><span className="spinner" /><span>Processing Payment...</span></>
            ) : (
              <span>💳 Pay ${amount || '0.00'}</span>
            )}
          </button>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
            🔐 Payment is secured with password verification and audit logging
          </p>
        </div>
      )}
    </div>
  );
}
