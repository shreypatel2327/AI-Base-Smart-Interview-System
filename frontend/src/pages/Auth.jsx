import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, KeyRound, RefreshCw, ChevronLeft, Hexagon, BarChart2 } from 'lucide-react';
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
          className="otp-input-field"
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
  const [role, setRole] = useState('Candidate');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError) {
      setError(urlError);
    }
  }, []);

  useEffect(() => { setError(''); setSuccess(''); }, [view]);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const saveSession = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data._id || data.userId);
    localStorage.setItem('userName', data.name);
    navigate('/dashboard');
  };

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

  const handleGithubLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/github`;
  };

  /* ── RENDER COMPONENTS ─────────── */

  const renderLeftPanel = () => (
    <div className="auth-left-panel">
       <div className="auth-logo" onClick={() => navigate('/')}>
           <div className="logo-icon-bg"><Hexagon size={18} color="#fff" /></div>
           <span className="logo-text">The Intelligent Layer</span>
       </div>
       
       <div className="auth-left-content">
           <h1 className="auth-headline">
               Experience the<br/>
               <span className="text-blue">Cognitive</span> Interview<br/>
               Canvas.
           </h1>
           <p className="auth-subhead">
               Moving beyond standard recruitment into a curated<br/>
               AI-driven analysis environment that understands<br/>
               human potential.
           </p>
           
           <div className="insight-card">
               <div className="insight-header">
                   <div className="insight-icon"><BarChart2 size={14} color="#005af0" /></div>
                   <div>
                       <div className="insight-label">LIVE INSIGHTS</div>
                       <div className="insight-title">Candidate Sentiment Analysis</div>
                   </div>
               </div>
               <div className="insight-progress-bg">
                   <div className="insight-progress-fill"></div>
               </div>
               <div className="insight-footer">
                   AI is currently analyzing vocal confidence and semantic depth...
               </div>
           </div>
       </div>
    </div>
  );

  const renderSocialButtons = () => (
    <div className="social-login-container">
      <div className="social-divider">
        <span></span><p>OR CONTINUE WITH</p><span></span>
      </div>
      <div className="social-buttons">
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed.')}
              useOneTap={false}
              shape="rectangular"
              size="large"
              theme="outline"
              text={view === VIEW.LOGIN ? 'signin_with' : 'signup_with'}
            />
        </GoogleOAuthProvider>

        <button type="button" onClick={handleGithubLogin} className="social-btn">
          <svg style={{width:'18px', height:'18px', marginRight: '8px'}} viewBox="0 0 24 24"><path fill="currentColor" d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57A12.02 12.02 0 0024 12c0-6.627-5.373-12-12-12z"/></svg>
          GitHub
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .auth-fullscreen {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, #f4f7fb 0%, #e0e8f5 100%);
          z-index: 2000;
          display: flex;
          font-family: "Inter", sans-serif;
          color: #1e293b;
        }
        
        .auth-left-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 60px;
          position: relative;
        }
        
        .auth-right-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        
        .auth-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-weight: 700;
          font-size: 1.2rem;
          color: #0f172a;
        }
        
        .logo-icon-bg {
          background-color: #005af0;
          padding: 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .auth-left-content {
          margin-top: 120px;
          max-width: 500px;
        }
        
        .auth-headline {
          font-size: 3.2rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1px;
          margin-bottom: 20px;
          color: #0f172a;
        }
        
        .text-blue {
          color: #005af0;
        }
        
        .auth-subhead {
          font-size: 1.05rem;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 40px;
        }
        
        .insight-card {
          background: #ffffff;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          width: 80%;
          border: 1px solid rgba(0,0,0,0.03);
        }
        
        .insight-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .insight-icon {
          width: 30px; height: 30px;
          border-radius: 6px;
          background-color: #f0f5ff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .insight-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #005af0;
          letter-spacing: 1px;
        }
        
        .insight-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #0f172a;
        }
        
        .insight-progress-bg {
          height: 6px;
          background-color: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        
        .insight-progress-fill {
           width: 65%;
           height: 100%;
           background-color: #005af0;
           border-radius: 10px;
        }
        
        .insight-footer {
          font-size: 0.75rem;
          color: #64748b;
        }
        
        .auth-form-card {
          background: #ffffff;
          width: 100%;
          max-width: 440px;
          padding: 48px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.04);
        }
        
        .form-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        
        .form-subtitle {
          font-size: 0.95rem;
          color: #475569;
          margin-bottom: 30px;
        }
        
        .role-toggle {
          display: flex;
          background-color: #f1f5f9;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 30px;
        }
        
        .role-btn {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          font-weight: 600;
          font-size: 0.9rem;
          color: #64748b;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .role-btn.active {
          background-color: #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          color: #005af0;
        }
        
        .input-group {
          margin-bottom: 20px;
        }
        
        .input-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .input-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #334155;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .forgot-link {
          font-size: 0.8rem;
          color: #005af0;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
        }
        
        .input-field-light {
          width: 100%;
          background-color: #f4f4f5;
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 14px 16px;
          font-size: 0.95rem;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, background-color 0.2s;
        }
        
        .input-field-light:focus {
          border-color: #005af0;
          background-color: #ffffff;
        }
        
        .btn-submit {
          width: 100%;
          background-color: #005af0;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 15px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
          transition: background-color 0.2s;
        }
        
        .btn-submit:hover {
          background-color: #0046c4;
        }
        
        .social-divider {
          display: flex;
          align-items: center;
          margin: 30px 0 20px;
        }
        .social-divider span {
          flex: 1;
          height: 1px;
          background-color: #e2e8f0;
        }
        .social-divider p {
          margin: 0 16px;
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 600;
          letter-spacing: 1px;
        }
        
        .social-buttons {
          display: flex;
          gap: 12px;
        }
        
        .social-btn {
          flex: 1;
          background-color: #f4f4f5;
          border: 1px solid #e4e4e7;
          border-radius: 8px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          font-weight: 600;
          color: #0f172a;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .social-btn:hover {
          background-color: #e4e4e7;
        }
        
        .footer-toggle {
          text-align: center;
          margin-top: 30px;
          font-size: 0.9rem;
          color: #64748b;
        }
        
        .error-msg {
          background-color: #fee2e2;
          color: #b91c1c;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 20px;
        }
        
        .success-msg {
          background-color: #d1fae5;
          color: #047857;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 20px;
        }
        
        .otp-input-field {
          width: 48px;
          height: 54px;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 700;
          background: #f4f4f5;
          border: 2px solid transparent;
          border-radius: 10px;
          color: #0f172a;
          outline: none;
        }
        
        .otp-input-field:focus {
           border-color: #005af0;
           background: #ffffff;
        }

        .bottom-right-stamp {
           position: absolute;
           bottom: 30px;
           right: 40px;
           font-size: 0.65rem;
           font-weight: 700;
           color: #94a3b8;
           letter-spacing: 1px;
           text-transform: uppercase;
           display: flex;
           align-items: center;
           gap: 6px;
        }
        .bottom-right-stamp .dot {
           width: 6px; height: 6px;
           background-color: #60a5fa;
           border-radius: 50%;
        }

        @media (max-width: 900px) {
          .auth-fullscreen {
             flex-direction: column;
             overflow-y: auto;
             background: #f4f7fb;
          }
          .auth-left-panel {
             padding: 40px 20px 20px;
             flex: none;
          }
          .auth-headline {
             font-size: 2.4rem;
          }
          .auth-left-content {
             margin-top: 40px;
             max-width: 100%;
          }
          .insight-card {
             width: 100%;
          }
          .auth-right-panel {
             padding: 20px;
             align-items: flex-start;
          }
          .auth-form-card {
             padding: 30px 20px;
          }
          .social-buttons {
             flex-direction: column;
          }
          .bottom-right-stamp {
             display: none;
          }
        }
      `}} />

      <div className="auth-fullscreen animate-fade-in">
         {renderLeftPanel()}
         <div className="auth-right-panel">
            <div className="auth-form-card">
              
              {/* LOGIN VIEW */}
              {view === VIEW.LOGIN && (
                <>
                  <h2 className="form-title">Welcome Back</h2>
                  <p className="form-subtitle">Sign in to your intelligent workspace</p>
                  
                  <div className="role-toggle">
                     <button className={role === 'Candidate' ? 'role-btn active' : 'role-btn'} onClick={() => setRole('Candidate')}>Candidate</button>
                     <button className={role === 'Recruiter' ? 'role-btn active' : 'role-btn'} onClick={() => setRole('Recruiter')}>Recruiter</button>
                  </div>
                  
                  {error && <div className="error-msg">{error}</div>}
                  
                  <form onSubmit={handleLogin}>
                     <div className="input-group">
                       <div className="input-header">
                         <label className="input-label">WORK EMAIL</label>
                       </div>
                       <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field-light" placeholder="name@company.com" required />
                     </div>
                     <div className="input-group">
                       <div className="input-header">
                         <label className="input-label">PASSWORD</label>
                         <span className="forgot-link" onClick={() => setView(VIEW.FORGOT)}>Forgot?</span>
                       </div>
                       <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field-light" placeholder="•••••••••" required />
                     </div>
                     
                     <button type="submit" className="btn-submit" disabled={loading}>
                       {loading ? <Loader2 size={18} className="pulse" /> : 'Continue to Platform'} <ArrowRight size={18} />
                     </button>
                  </form>
                  
                  {renderSocialButtons()}
                  
                  <div className="footer-toggle">
                     Don't have an account? <span className="forgot-link" onClick={() => setView(VIEW.REGISTER)} style={{marginLeft: '4px'}}>Create an account</span>
                  </div>
                </>
              )}

              {/* REGISTER VIEW */}
              {view === VIEW.REGISTER && (
                <>
                  <h2 className="form-title">Create an Account</h2>
                  <p className="form-subtitle">Start practicing real AI interviews.</p>
                  
                  <div className="role-toggle">
                     <button className={role === 'Candidate' ? 'role-btn active' : 'role-btn'} onClick={() => setRole('Candidate')}>Candidate</button>
                     <button className={role === 'Recruiter' ? 'role-btn active' : 'role-btn'} onClick={() => setRole('Recruiter')}>Recruiter</button>
                  </div>
                  
                  {error && <div className="error-msg">{error}</div>}
                  
                  <form onSubmit={handleRegister}>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                       <div className="input-group">
                         <div className="input-header"><label className="input-label">FIRST NAME</label></div>
                         <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input-field-light" placeholder="John" required />
                       </div>
                       <div className="input-group">
                         <div className="input-header"><label className="input-label">LAST NAME</label></div>
                         <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input-field-light" placeholder="Doe" />
                       </div>
                     </div>
                     <div className="input-group">
                       <div className="input-header"><label className="input-label">WORK EMAIL</label></div>
                       <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field-light" placeholder="name@company.com" required />
                     </div>
                     <div className="input-group">
                       <div className="input-header"><label className="input-label">PASSWORD</label></div>
                       <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field-light" placeholder="Min 6 chars" required />
                     </div>
                     <div className="input-group">
                       <div className="input-header"><label className="input-label">CONFIRM PASSWORD</label></div>
                       <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-field-light" placeholder="•••••••••" required />
                     </div>
                     
                     <button type="submit" className="btn-submit" disabled={loading}>
                       {loading ? <Loader2 size={18} className="pulse" /> : 'Create Account'} <ArrowRight size={18} />
                     </button>
                  </form>
                  
                  {renderSocialButtons()}
                  
                  <div className="footer-toggle">
                     Already have an account? <span className="forgot-link" onClick={() => setView(VIEW.LOGIN)} style={{marginLeft: '4px'}}>Sign in</span>
                  </div>
                </>
              )}

              {/* OTP VIEW */}
              {view === VIEW.OTP && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }} onClick={() => setView(VIEW.LOGIN)}>
                     <ChevronLeft size={18} /> Back
                  </div>
                  <h2 className="form-title">Verify Email</h2>
                  <p className="form-subtitle">We sent a 6-digit code to <strong>{pendingEmail}</strong></p>
                  
                  {error && <div className="error-msg">{error}</div>}
                  {success && <div className="success-msg">{success}</div>}
                  
                  <form onSubmit={handleVerifyOtp} style={{ marginTop: '30px' }}>
                     <OtpInput otp={otp} setOtp={setOtp} />
                     <button type="submit" className="btn-submit" disabled={loading}>
                       {loading ? <Loader2 size={18} className="pulse" /> : 'Verify OTP'} <KeyRound size={18} style={{marginLeft: '4px'}} />
                     </button>
                  </form>
                  
                  <div className="footer-toggle">
                     Didn't receive it? <span className="forgot-link" style={{marginLeft: '4px'}} onClick={async () => {
                       setError(''); setSuccess('');
                       try {
                         const { data } = await api.post('/auth/resend-otp', { email: pendingEmail });
                         setSuccess(data.message || 'OTP resent successfully.');
                       } catch (err) {
                         setError(err.response?.data?.message || 'Failed to resend OTP.');
                       }
                     }}>Resend OTP</span>
                  </div>
                </>
              )}

              {/* FORGOT PASSWORD VIEW */}
              {view === VIEW.FORGOT && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }} onClick={() => setView(VIEW.LOGIN)}>
                     <ChevronLeft size={18} /> Back
                  </div>
                  <h2 className="form-title">Forgot Password</h2>
                  <p className="form-subtitle">Enter your email and we'll send a reset link.</p>
                  
                  {error && <div className="error-msg">{error}</div>}
                  
                  <form onSubmit={handleForgotPassword} style={{ marginTop: '20px' }}>
                     <div className="input-group">
                       <div className="input-header"><label className="input-label">WORK EMAIL</label></div>
                       <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field-light" placeholder="name@company.com" required />
                     </div>
                     <button type="submit" className="btn-submit" disabled={loading}>
                       {loading ? <Loader2 size={18} className="pulse" /> : 'Send Reset Link'} <ArrowRight size={18} />
                     </button>
                  </form>
                </>
              )}

              {/* FORGOT SENT VIEW */}
              {view === VIEW.FORGOT_SENT && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📬</div>
                  <h2 className="form-title">Check Your Inbox</h2>
                  <p className="form-subtitle" style={{ lineHeight: '1.6' }}>We've sent a password reset link to <br/><strong>{formData.email}</strong>. Valid for 15 minutes.</p>
                  <button className="btn-submit" onClick={() => setView(VIEW.LOGIN)} style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                     <ChevronLeft size={16} /> Back to Login
                  </button>
                </div>
              )}

            </div>
            
            <div className="bottom-right-stamp">
              BUILT ON SEMANTIC AI CORE <span className="dot"></span>
            </div>
         </div>
      </div>
    </>
  );
};

export default Auth;
