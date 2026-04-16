import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Play, History, Loader2, Star } from 'lucide-react';
import api from '../services/api';
import { createOrder, verifyPayment, reportFailure } from '../services/paymentService';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [activeResume, setActiveResume] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // ── OAuth Token Capture & URL Scrubbing ────────────────
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userId = params.get('userId');
    const name = params.get('name');

    if (token && userId) {
      console.log("[OAuth Debug] Token from URL:", token);
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      if (name) localStorage.setItem('userName', decodeURIComponent(name));
      
      console.log("[OAuth Debug] Token in localStorage:", localStorage.getItem("token"));

      // Remove sensitive data from URL and history AFTER saving
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('[Auth] Session captured from URL and scrubbed.');
    }

    fetchUser();
    fetchInterviews();
    fetchActiveResume();
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) setUser(data.data);
    } catch (err) {
      console.error('Failed to fetch user', err);
    }
  };

  const fetchInterviews = async () => {
    try {
      const { data } = await api.get('/interviews');
      if (data.success) {
        setInterviews(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch interviews', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveResume = async () => {
    try {
      const { data } = await api.get('/resume');
      if (data.success) setActiveResume(data.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Failed to fetch active resume', err);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      const uploadRes = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setActiveResume(uploadRes.data.data);
      e.target.value = null; // reset input
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to upload resume');
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewPdf = async () => {
    try {
      const response = await api.get('/resume/download', {
        responseType: 'blob'
      });
      const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error('Failed to open PDF', err);
      alert('Failed to load PDF. Please try again.');
    }
  };

  const handleStartInterview = async () => {
    if (!activeResume) {
      alert("Please upload your resume first.");
      return;
    }

    setIsUploading(true);
    try {
      const startRes = await api.post('/interviews/start');
      const interviewId = startRes.data.data.interviewId;

      navigate(`/interview/${interviewId}`, { state: { initialData: startRes.data.data } });

    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 && err.response?.data?.message.includes('plan limit reached')) {
        alert("Free plan limit reached. Please upgrade to Pro.");
      } else {
        alert(err.response?.data?.message || "Failed to start interview");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpgradeOptions = async () => {
    setIsProcessingPayment(true);
    try {
      const orderData = await createOrder();
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: "INR",
        name: "AI Interview Platform",
        description: "Pro Plan Upgrade",
        order_id: orderData.data.order_id,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            alert("Payment Successful! You are now a Pro user.");
            fetchUser();
            setIsProcessingPayment(false);
          } catch (verifyErr) {
            alert("Payment Verification Failed.");
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
             reportFailure({ order_id: orderData.data.order_id }).catch(e => console.error(e));
             setIsProcessingPayment(false);
             alert("Payment Cancelled.");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response){
         await reportFailure({
             order_id: response.error.metadata.order_id,
             payment_id: response.error.metadata.payment_id,
             error_code: response.error.code,
             error_reason: response.error.reason
         });
         alert("Payment Failed. Please try again.");
         setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
       console.error("Order creation failed", err);
       alert("Could not initialize payment.");
       setIsProcessingPayment(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
      <div style={styles.header}>
        <h1 style={{ fontSize: '2.5rem' }}>Your Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your resume, start a new interview, or review past performance.</p>
      </div>

      <div style={styles.grid}>
        {/* Start New Interview Section */}
        <div className="glass-panel" style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ ...styles.iconBox, background: 'rgba(99, 102, 241, 0.2)', width: '48px', height: '48px' }}>
              <Play color="#6366f1" size={24} />
            </div>
            <h2>Start New Interview</h2>
          </div>

          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Upload your latest resume (PDF) to generate an AI interview tailored to your experience.
          </p>

          <div style={styles.uploadArea}>
            <input 
              type="file" 
              accept="application/pdf"
              id="resume-upload"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            {activeResume ? (
              <div style={styles.activeResumeBox}>
                <FileText color="var(--primary)" size={32} style={{ marginBottom: '10px' }} />
                <h4 style={{ color: 'var(--text-main)', marginBottom: '4px' }}>{activeResume.originalFileName}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Uploaded on {new Date(activeResume.createdAt).toLocaleDateString()}</p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button type="button" onClick={handleViewPdf} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>View PDF</button>
                  <label htmlFor="resume-upload" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
                    {isUploading ? <Loader2 className="pulse" size={14} /> : 'Replace'}
                  </label>
                </div>
              </div>
            ) : (
              <label htmlFor="resume-upload" style={{ ...styles.uploadLabel, opacity: isUploading ? 0.5 : 1 }}>
                {isUploading ? <Loader2 className="pulse" size={24} style={{ marginBottom: '10px', color: 'var(--primary)' }} /> : <Upload size={24} style={{ marginBottom: '10px', color: 'var(--primary)' }} />}
                <span style={{ fontWeight: '500' }}>{isUploading ? 'Uploading...' : 'Click to upload resume (PDF)'}</span>
                {!isUploading && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Max size 5MB</span>}
              </label>
            )}
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '20px' }} 
            onClick={handleStartInterview}
            disabled={!activeResume || isUploading || isProcessingPayment}
          >
            {isUploading ? <><Loader2 className="pulse" size={18} /> Processing...</> : "Start Interview Simulator"}
          </button>
        </div>

        {/* Upgrade Plan Section */}
        {user && user.plan === 'free' && (
          <div className="glass-panel" style={{...styles.card, background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(99,102,241,0.1) 100%)', gridColumn: '1 / -1'}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               <div style={{ ...styles.iconBox, background: 'rgba(168, 85, 247, 0.2)', width: '56px', height: '56px' }}>
                 <Star color="#a855f7" size={28} />
               </div>
               <div style={{ flex: 1 }}>
                 <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Upgrade to Pro Plan</h2>
                 <p style={{ color: 'var(--text-muted)' }}>You are currently on the Free plan (limit: 1 interview). Get unlimited access and full AI reports.</p>
               </div>
               <button 
                  className="btn btn-primary" 
                  style={{ padding: '12px 24px' }}
                  onClick={handleUpgradeOptions}
                  disabled={isProcessingPayment}
               >
                 {isProcessingPayment ? <Loader2 className="pulse" size={18} /> : "Upgrade Now - ₹499"}
               </button>
            </div>
          </div>
        )}

        {/* History Section */}
        <div className="glass-panel" style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ ...styles.iconBox, background: 'rgba(236, 72, 153, 0.2)', width: '48px', height: '48px' }}>
              <History color="#ec4899" size={24} />
            </div>
            <h2>Past Interviews</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading history...</div>
          ) : interviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p>No past interviews found.</p>
            </div>
          ) : (
            <div style={styles.historyList}>
              {interviews.map(interview => (
                <div key={interview._id} style={styles.historyItem}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      Interview {new Date(interview.createdAt).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%', 
                        background: interview.status === 'completed' ? '#10b981' : '#f59e0b'
                      }}></span>
                      {interview.status === 'completed' ? 'Completed' : 'Ongoing'}
                    </div>
                  </div>
                  {interview.status === 'completed' && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                      onClick={() => navigate(`/report/${interview._id}`)}
                    >
                      View Report
                    </button>
                  )}
                  {interview.status === 'ongoing' && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '8px 16px', fontSize: '0.9rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      onClick={() => navigate(`/interview/${interview._id}`)}
                    >
                      Resume
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const styles = {
  header: {
    marginBottom: '40px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1.2fr)',
    gap: '30px',
  },
  card: {
    padding: '30px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  iconBox: {
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadArea: {
    border: '2px dashed var(--glass-border)',
    borderRadius: '12px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    transition: 'all 0.3s',
    marginTop: 'auto',
    textAlign: 'center'
  },
  activeResumeBox: {
    padding: '30px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    maxHeight: '400px',
    paddingRight: '8px',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
  }
};

export default Dashboard;
