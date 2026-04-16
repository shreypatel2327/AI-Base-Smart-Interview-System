import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, KeyRound, RefreshCw, ChevronLeft } from 'lucide-react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import api from '../services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

// View states
const VIEW = {
  LOGIN: 'login',
  REGISTER: 'register',
  OTP: 'otp',
  FORGOT: 'forgot',
  FORGOT_SENT: 'forgot_sent',
};

/* ── OTP Input Component ───────────────────────────── */
const OtpInput = ({ otp, setOtp }) => {
  const inputRefs = useRef([]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: '52px', height: '58px',
            textAlign: 'center', fontSize: '1.5rem', fontWeight: '700',
            background: 'rgba(255,255,255,0.06)',
            border: `2px solid ${digit ? 'var(--primary)' : 'var(--glass-border)'}`,
            borderRadius: '12px', color: 'var(--text-main)',
            outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: digit ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
            caret: 'transparent',
          }}
        />
      ))}
    </div>
  );
};

/* ── Main Auth Component ───────────────────────────── */
const Auth = () => {
  const [view, setView] = useState(VIEW.LOGIN);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check for URL errors or success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError) {
      setError(urlError);
    }
  }, []);

  // clear messages when switching view
  useEffect(() => { setError(''); setSuccess(''); }, [view]);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const saveSession = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data._id || data.userId);
    localStorage.setItem('userName', data.name);
    navigate('/dashboard');
  };

  /* ── LOGIN ──────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: formData.email, password: formData.password });
      if (data.success) saveSession(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred.';
      if (err.response?.data?.isVerified === false) {
        setPendingEmail(formData.email);
        setError('Email not verified. Please enter the OTP sent to your inbox.');
        setView(VIEW.OTP);
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  /* ── REGISTER ───────────────── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); 
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      if (data.success) {
        setPendingEmail(formData.email);
        setView(VIEW.OTP);
        setSuccess('Account created! Check your email for the 6-digit OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally { setLoading(false); }
  };

  /* ── VERIFY OTP ─────────────── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return setError('Please enter the complete 6-digit OTP.');
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: pendingEmail, otp: code });
      if (data.success) saveSession(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
      setOtp(['', '', '', '', '', '']);
    } finally { setLoading(false); }
  };

  /* ── FORGOT PASSWORD ────────── */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: formData.email });
      setView(VIEW.FORGOT_SENT);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link.');
    } finally { setLoading(false); }
  };

  /* ── GOOGLE SOCIAL LOGIN ────── */
  const handleGoogleSuccess = async (credentialResponse) => {
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/social-login', {
        provider: 'google',
        credential: credentialResponse.credential,
      });
      if (data.success) saveSession(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed.');
    } finally { setLoading(false); }
  };

  /* ── GITHUB SOCIAL LOGIN ────── */
  const handleGithubLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/github`;
  };

  /* ── RENDER HELPERS ─────────── */
  const renderInputField = ({ label, name, type = 'text', placeholder, icon: Icon, required = true }) => (
    <div className="input-group" style={{ marginBottom: '18px' }}>
      <label className="input-label">{label}</label>
      <div style={styles.inputWrapper}>
        <Icon size={18} style={styles.inputIcon} />
        <input
          type={type} name={name} className="input-field"
          placeholder={placeholder}
          style={{ paddingLeft: '40px' }}
          value={formData[name]}
          onChange={handleChange}
          required={required}
        />
      </div>
    </div>
  );

  const renderSocialDivider = () => (
    <div style={styles.divider}>
      <span style={styles.dividerLine} />
      <span style={styles.dividerText}>or</span>
      <span style={styles.dividerLine} />
    </div>
  );

  const renderSocialButtons = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed.')}
            useOneTap={false}
            shape="rectangular"
            size="large"
            text={view === VIEW.LOGIN ? 'signin_with' : 'signup_with'}
            theme="filled_black"
          />
      </GoogleOAuthProvider>

      <button 
        type="button" 
        onClick={handleGithubLogin} 
        style={styles.githubBtn}
        className="btn"
      >
        <Lock size={20} /> 
        {view === VIEW.LOGIN ? 'Sign in with GitHub' : 'Sign up with GitHub'}
      </button>
    </div>
  );

  /* ── VIEW: LOGIN ──────────────────── */
  if (view === VIEW.LOGIN) return (
    <div style={styles.container} className="animate-fade-in">
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconBadge}>🔐</div>
          <h2 style={{ marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Sign in to continue your AI interview journey.</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
          {renderInputField({ label: 'Email Address', name: 'email', type: 'email', placeholder: 'you@example.com', icon: Mail })}
          {renderInputField({ label: 'Password', name: 'password', type: 'password', placeholder: '••••••••', icon: Lock })}

          <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '20px' }}>
            <span style={styles.link} onClick={() => setView(VIEW.FORGOT)}>Forgot password?</span>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><Loader2 size={18} className="pulse" /> Signing in...</> : <> Sign In <ArrowRight size={18} /></>}
          </button>
        </form>

        {renderSocialDivider()}
        {renderSocialButtons()}

        <p style={styles.toggleText}>
          Don't have an account?{' '}
          <span style={styles.link} onClick={() => setView(VIEW.REGISTER)}>Create one</span>
        </p>
      </div>
    </div>
  );

  /* ── VIEW: REGISTER ──────────────── */
  if (view === VIEW.REGISTER) return (
    <div style={styles.container} className="animate-fade-in">
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconBadge}>✨</div>
          <h2 style={{ marginBottom: '8px' }}>Create an Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Start practicing real AI interviews for free.</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group" style={{ marginBottom: '18px' }}>
              <label className="input-label">First Name *</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input type="text" name="firstName" className="input-field" placeholder="John"
                  style={{ paddingLeft: '40px' }} value={formData.firstName} onChange={handleChange} required />
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: '18px' }}>
              <label className="input-label">Last Name</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input type="text" name="lastName" className="input-field" placeholder="Doe"
                  style={{ paddingLeft: '40px' }} value={formData.lastName} onChange={handleChange} />
              </div>
            </div>
          </div>
          {renderInputField({ label: 'Email Address', name: 'email', type: 'email', placeholder: 'you@example.com', icon: Mail })}
          {renderInputField({ label: 'Password', name: 'password', type: 'password', placeholder: 'Min 6 characters', icon: Lock })}
          {renderInputField({ label: 'Confirm Password', name: 'confirmPassword', type: 'password', placeholder: '••••••••', icon: Lock })}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><Loader2 size={18} className="pulse" /> Creating Account...</> : <> Create Account <ArrowRight size={18} /></>}
          </button>
        </form>

        {renderSocialDivider()}
        {renderSocialButtons()}

        <p style={styles.toggleText}>
          Already have an account?{' '}
          <span style={styles.link} onClick={() => setView(VIEW.LOGIN)}>Sign in</span>
        </p>
      </div>
    </div>
  );

  /* ── VIEW: OTP VERIFICATION ──────── */
  if (view === VIEW.OTP) return (
    <div style={styles.container} className="animate-fade-in">
      <div className="glass-panel" style={{ ...styles.card, maxWidth: '420px' }}>
        <button onClick={() => setView(VIEW.LOGIN)} style={styles.backBtn}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={styles.header}>
          <div style={styles.iconBadge}>📩</div>
          <h2 style={{ marginBottom: '8px' }}>Verify Your Email</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            We sent a 6-digit OTP to<br />
            <strong style={{ color: 'var(--text-main)' }}>{pendingEmail}</strong>
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        <form onSubmit={handleVerifyOtp}>
          <OtpInput otp={otp} setOtp={setOtp} />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><Loader2 size={18} className="pulse" /> Verifying...</> : <> Verify OTP <KeyRound size={18} /></>}
          </button>
        </form>

        <p style={{ ...styles.toggleText, marginTop: '16px' }}>
          Didn't receive it?{' '}
          <span style={styles.link} onClick={async () => {
            setError(''); setSuccess('');
            try {
              const { data } = await api.post('/auth/resend-otp', { email: pendingEmail });
              setSuccess(data.message || 'A new OTP has been sent to your email.');
            } catch (err) {
              setError(err.response?.data?.message || 'Failed to resend OTP.');
            }
          }}>
            <RefreshCw size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Resend OTP
          </span>
        </p>
      </div>
    </div>
  );

  /* ── VIEW: FORGOT PASSWORD ─────────── */
  if (view === VIEW.FORGOT) return (
    <div style={styles.container} className="animate-fade-in">
      <div className="glass-panel" style={{ ...styles.card, maxWidth: '420px' }}>
        <button onClick={() => setView(VIEW.LOGIN)} style={styles.backBtn}>
          <ChevronLeft size={16} /> Back to Login
        </button>
        <div style={styles.header}>
          <div style={styles.iconBadge}>🔑</div>
          <h2 style={{ marginBottom: '8px' }}>Forgot Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Enter your email address and we'll send you a secure reset link.
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column' }}>
          {renderInputField({ label: 'Email Address', name: 'email', type: 'email', placeholder: 'you@example.com', icon: Mail })}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><Loader2 size={18} className="pulse" /> Sending...</> : <> Send Reset Link <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );

  /* ── VIEW: FORGOT SENT ─────────────── */
  if (view === VIEW.FORGOT_SENT) return (
    <div style={styles.container} className="animate-fade-in">
      <div className="glass-panel" style={{ ...styles.card, maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📬</div>
        <h2 style={{ marginBottom: '12px' }}>Check Your Inbox</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '28px' }}>
          We've sent a password reset link to <strong style={{ color: 'var(--text-main)' }}>{formData.email}</strong>.
          The link is valid for <strong>15 minutes</strong>.
        </p>
        <button className="btn btn-secondary" onClick={() => setView(VIEW.LOGIN)} style={{ width: '100%' }}>
          <ChevronLeft size={16} /> Back to Login
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 'calc(100vh - 120px)', padding: '20px',
  },
  card: {
    width: '100%', maxWidth: '480px', padding: '40px',
  },
  header: {
    textAlign: 'center', marginBottom: '28px',
  },
  iconBadge: {
    fontSize: '2.5rem', marginBottom: '12px', lineHeight: 1,
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171', padding: '12px', borderRadius: '8px',
    marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center',
  },
  successBox: {
    background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399', padding: '12px', borderRadius: '8px',
    marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center',
  },
  inputWrapper: {
    position: 'relative', display: 'flex', alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute', left: '12px', color: 'var(--text-muted)',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '12px',
    margin: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem',
  },
  dividerLine: {
    flex: 1, height: '1px', background: 'var(--glass-border)',
  },
  dividerText: {
    flexShrink: 0,
  },
  toggleText: {
    textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '20px',
  },
  link: {
    color: 'var(--primary)', fontWeight: '600', cursor: 'pointer',
    textDecoration: 'underline', background: 'none', border: 'none',
    padding: 0, display: 'inline',
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: '4px',
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', fontSize: '0.9rem', marginBottom: '20px',
    padding: 0,
  },
  githubBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '12px', background: '#24292e', color: 'white', border: 'none',
    padding: '12px', borderRadius: '4px', fontSize: '14px', fontWeight: '500',
    cursor: 'pointer', transition: 'background 0.2s',
  }
};

export default Auth;
