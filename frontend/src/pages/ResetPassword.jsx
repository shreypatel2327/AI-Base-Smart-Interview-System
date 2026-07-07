import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import api from '../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { newPassword });
      if (data.success) setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset token.');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="glass-panel" style={styles.card}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={56} color="#10b981" style={{ marginBottom: '20px' }} />
            <h2 style={{ marginBottom: '12px' }}>Password Reset!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>
              Your password has been updated successfully.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/auth')}>
              Go to Login <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>
              <h2 style={{ marginBottom: '8px' }}>Set New Password</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Choose a strong new password for your account.
              </p>
            </div>

            {error && (
              <div style={styles.errorBox}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="input-group">
                <label className="input-label">New Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    type="password" className="input-field"
                    placeholder="Min 6 characters"
                    style={{ paddingLeft: '40px' }}
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Confirm Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    type="password" className="input-field"
                    placeholder="••••••••"
                    style={{ paddingLeft: '40px' }}
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading
                  ? <><Loader2 size={18} className="pulse" /> Resetting...</>
                  : <>Reset Password <ArrowRight size={18} /></>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 'calc(100vh - 120px)', padding: '20px',
  },
  card: { width: '100%', maxWidth: '420px', padding: '40px' },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171', padding: '12px', borderRadius: '8px',
    fontSize: '0.9rem', textAlign: 'center',
  },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px', color: 'var(--text-muted)' },
};

export default ResetPassword;
