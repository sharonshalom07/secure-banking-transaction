import { useMemo } from 'react';

interface PasswordStrengthProps {
  password: string;
}

interface Criterion {
  label: string;
  met: boolean;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const analysis = useMemo(() => {
    const criteria: Criterion[] = [
      { label: 'At least 8 characters', met: password.length >= 8 },
      { label: '12+ characters (recommended)', met: password.length >= 12 },
      { label: 'Uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
      { label: 'Lowercase letter (a-z)', met: /[a-z]/.test(password) },
      { label: 'Number (0-9)', met: /\d/.test(password) },
      { label: 'Special character (!@#$%...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) },
    ];

    const score = criteria.filter((c) => c.met).length;

    let label = '';
    let color = '';
    let barColor = '';

    if (password.length === 0) {
      label = '';
      color = '';
      barColor = 'transparent';
    } else if (score <= 2) {
      label = 'Weak';
      color = '#f43f5e';
      barColor = '#f43f5e';
    } else if (score <= 3) {
      label = 'Fair';
      color = '#f59e0b';
      barColor = '#f59e0b';
    } else if (score <= 4) {
      label = 'Good';
      color = '#06b6d4';
      barColor = '#06b6d4';
    } else if (score <= 5) {
      label = 'Strong';
      color = '#10b981';
      barColor = '#10b981';
    } else {
      label = 'Very Strong';
      color = '#10b981';
      barColor = 'linear-gradient(90deg, #10b981, #06b6d4)';
    }

    const percentage = (score / 6) * 100;

    return { criteria, score, label, color, barColor, percentage };
  }, [password]);

  if (!password) return null;

  return (
    <div className="animate-fade-in" style={{ marginTop: '8px' }}>
      {/* Strength Bar */}
      <div className="strength-bar" style={{ marginBottom: '8px' }}>
        <div
          className="strength-bar-fill"
          style={{
            width: `${analysis.percentage}%`,
            background: analysis.barColor,
          }}
        />
      </div>

      {/* Label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Password Strength</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: analysis.color }}>{analysis.label}</span>
      </div>

      {/* Criteria Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        {analysis.criteria.map((criterion, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: criterion.met ? 'var(--accent-emerald)' : 'var(--text-muted)',
              transition: 'color 0.3s ease',
            }}
          >
            <span style={{ fontSize: '13px', lineHeight: 1 }}>
              {criterion.met ? '✓' : '○'}
            </span>
            <span>{criterion.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
