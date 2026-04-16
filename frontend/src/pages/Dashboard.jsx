import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, History, Loader2, Star, Shield, ArrowRight, TrendingUp, Sparkles, Code } from 'lucide-react';
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
      rzp.on('payment.failed', async function (response) {
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
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .dashboard-layout {
          background-color: #f8fafc;
          min-height: 100vh;
          width: 100%;
          font-family: "Inter", sans-serif;
          color: #0f172a;
          padding: 80px 5% 60px;
        }

        .dash-container {
          max-width: 1300px;
          margin: 0 auto;
        }

        /* Top Grid */
        .top-grid {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 60px;
          margin-bottom: 50px;
          align-items: center;
        }

        .greeting-col h1 {
          font-size: clamp(2.2rem, 4vw, 3.2rem);
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1px;
          margin-bottom: 16px;
        }

        .greeting-col p {
          font-size: 1.1rem;
          color: #475569;
          line-height: 1.6;
          max-width: 90%;
        }

        /* Resume Upload Box & Actions */
        .resume-widget {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .dashed-box {
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          background-color: rgba(255,255,255,0.6);
          padding: 40px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .dashed-box:hover {
          border-color: #005af0;
          background-color: #ffffff;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }

        .upload-icon-circle {
          width: 64px;
          height: 64px;
          background-color: #eff6ff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .upload-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .upload-sub {
          font-size: 0.9rem;
          color: #64748b;
          margin-bottom: 24px;
        }

        .btn-browse {
          background-color: #e2e8f0;
          color: #0f172a;
          border: none;
          padding: 10px 24px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn-browse:hover {
          background-color: #cbd5e1;
        }

        /* Active Resume State inside Dashed Box */
        .resume-active-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .active-file-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #005af0;
          margin: 10px 0 4px;
          word-break: break-all;
        }
        .active-file-date {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 20px;
        }
        .resume-action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        /* Resume Lower Actions */
        .resume-lower-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }
        .privacy-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.75rem;
          color: #64748b;
          max-width: 60%;
          line-height: 1.4;
        }
        .btn-primary-launch {
          background-color: #8bb6ff; /* soft blue as in image 2 initially, but wait, image 1 has bright blue */
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          color: #fff;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-primary-launch:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        .btn-primary-launch:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Bottom Grid */
        .bottom-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 40px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-header h2 {
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
        }

        .view-all-link {
          font-size: 0.85rem;
          font-weight: 700;
          color: #005af0;
          cursor: pointer;
        }

        /* Activity Cards */
        .activity-card {
          background-color: #ffffff;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.03);
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 16px;
          transition: transform 0.2s;
        }
        .activity-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.04);
        }

        .activity-icon-wrap {
          width: 48px;
          height: 48px;
          background-color: #eff6ff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-details {
          flex: 1;
        }

        .activity-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .activity-meta {
          font-size: 0.85rem;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .activity-score-wrap {
          text-align: right;
          min-width: 120px;
        }

        .score-big {
          font-size: 1.8rem;
          font-weight: 800;
          color: #005af0;
          line-height: 1;
          margin-bottom: 4px;
        }

        .score-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.5px;
        }

        .activity-action-btn {
          background-color: transparent;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .activity-action-btn:hover {
          border-color: #005af0;
          color: #005af0;
        }

        /* Performance Cards */
        .perf-card {
          background-color: #ffffff;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.03);
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          margin-bottom: 20px;
        }

        .avg-score-card {
          background: linear-gradient(135deg, #ffffff 0%, #f4f7fb 100%);
        }

        .perf-label-top {
          font-size: 0.75rem;
          font-weight: 700;
          color: #005af0;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          display: block;
        }

        .perf-big-value {
          font-size: 3rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
          margin-bottom: 12px;
        }

        .perf-trend {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #10b981;
          font-weight: 600;
          font-size: 0.85rem;
        }

        /* Chart mock */
        .mock-chart-container {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 70px;
          margin: 20px 0;
        }
        .mock-bar {
          flex: 1;
          background-color: #60a5fa;
          border-radius: 4px 4px 0 0;
          min-height: 20px;
        }
        .mock-bar:nth-child(even) { background-color: #3b82f6; }
        .mock-bar:last-child { background-color: #1d4ed8; height: 100% !important; }

        .perf-insight-text {
          font-size: 0.85rem;
          font-style: italic;
          color: #475569;
        }

        /* Pro Banner */
        .pro-banner {
          background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
          border: 1px solid #bfdbfe;
          border-radius: 16px;
          padding: 24px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 50px;
        }
        .pro-banner-content h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 4px;
        }
        .pro-banner-content p {
          font-size: 0.95rem;
          color: #3b82f6;
        }
        .btn-upgrade {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 1024px) {
          .top-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .greeting-col {
            text-align: center;
          }
          .greeting-col p {
            margin: 0 auto;
          }
          .bottom-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />

      <div className="dashboard-layout animate-fade-in">
        <div className="dash-container">

          {/* Top Section */}
          <div className="top-grid">
            <div className="greeting-col">
              <h1>Good morning, {user?.firstName || 'Candidate'}.</h1>
              <p>Your next leap in career starts here. Practice with our AI and master the art of the interview through real-time feedback and sentiment analysis.</p>
            </div>

            <div className="resume-widget">
              <div className="dashed-box">
                {activeResume ? (
                  <div className="resume-active-wrapper">
                    <div className="upload-icon-circle">
                      <FileText size={28} color="#005af0" />
                    </div>
                    <h4 className="active-file-name">{activeResume.originalFileName}</h4>
                    <p className="active-file-date">Processed for AI Analysis • {new Date(activeResume.createdAt).toLocaleDateString()}</p>

                    {/* Using mock progress bar to mimic second image */}
                    <div style={{ width: '80%', height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', margin: '0 auto 20px' }}>
                      <div style={{ width: '100%', height: '100%', background: '#005af0' }}></div>
                    </div>

                    <div className="resume-action-buttons">
                      <button type="button" onClick={handleViewPdf} className="btn-browse">View PDF</button>
                      <label htmlFor="resume-upload" className="btn-browse" style={{ cursor: 'pointer', margin: 0 }}>
                        {isUploading ? <Loader2 size={16} className="pulse" /> : 'Replace'}
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="resume-active-wrapper">
                    <div className="upload-icon-circle">
                      {isUploading ? <Loader2 size={28} className="pulse" color="#005af0" /> : <Upload size={28} color="#005af0" />}
                    </div>
                    <h4 className="upload-title">Drag & drop your resume</h4>
                    <p className="upload-sub">Only PDF files are supported for AI analysis</p>
                    <label htmlFor="resume-upload" className="btn-browse" style={{ display: 'inline-block' }}>Browse Files</label>
                  </div>
                )}
                <input type="file" accept="application/pdf" id="resume-upload" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isUploading} />
              </div>

              <div className="resume-lower-actions">
                <div className="privacy-note">
                  <Shield strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Your data is encrypted and used only for interview personalization.</span>
                </div>
                <button className="btn-primary-launch" onClick={handleStartInterview} disabled={!activeResume || isUploading || isProcessingPayment}>
                  {isUploading ? 'Processing...' : 'Start Interview'}
                  {!isUploading && !isProcessingPayment && <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Pro Banner */}
          {user && user.plan === 'free' && (
            <div className="pro-banner">
              <div className="pro-banner-content">
                <h3>Upgrade to Pro Plan</h3>
                <p>You are currently on the Free plan (limit: 1 interview). Get unlimited access and full true AI reports for ₹499.</p>
              </div>
              <button className="btn-upgrade" onClick={handleUpgradeOptions} disabled={isProcessingPayment}>
                {isProcessingPayment ? <Loader2 size={16} className="pulse" /> : 'Upgrade Now'}
              </button>
            </div>
          )}

          {/* Bottom Section */}
          <div className="bottom-grid">
            {/* Recent Activity */}
            <div className="activity-col">
              <div className="section-header">
                <h2>Recent Activity</h2>
                <span className="view-all-link">View all sessions</span>
              </div>

              {loading ? (
                <p style={{ color: '#64748b' }}>Loading history...</p>
              ) : interviews.length === 0 ? (
                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No past interviews found.</p>
              ) : (
                <div className="activity-list">
                  {interviews.map(interview => {
                    const isComplete = interview.status === 'completed';
                    return (
                      <div key={interview._id} className="activity-card">
                        <div className="activity-icon-wrap" style={{ backgroundColor: isComplete ? '#eff6ff' : '#fff7ed' }}>
                          {isComplete ? <Sparkles size={20} color="#005af0" /> : <Code size={20} color="#ea580c" />}
                        </div>

                        <div className="activity-details">
                          <h4 className="activity-title">Role Simulation</h4>
                          <div className="activity-meta">
                            <span>📅 {new Date(interview.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{isComplete ? '45 mins session' : 'Ongoing session'}</span>
                            <span>•</span>
                            <button
                              className="activity-action-btn"
                              onClick={() => isComplete ? navigate(`/report/${interview._id}`) : navigate(`/interview/${interview._id}`)}
                            >
                              {isComplete ? 'View Report' : 'Resume'}
                            </button>
                          </div>
                        </div>

                        <div className="activity-score-wrap">
                          <div className="score-big">{isComplete ? '88%' : '---'}</div>
                          <div className="score-label">AI CONFIDENCE SCORE</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Performance */}
            <div className="performance-col">
              <div className="section-header">
                <h2>Performance</h2>
              </div>

              <div className="perf-card avg-score-card">
                <span className="perf-label-top">AVERAGE SCORE</span>
                <div className="perf-big-value">84.3</div>
                <div className="perf-trend"><TrendingUp strokeWidth={3} /> +5.2% from last week</div>
              </div>

              <div className="perf-card">
                <span className="perf-label-top" style={{ color: '#0f172a' }}>IMPROVEMENT TREND</span>
                <div className="mock-chart-container">
                  <div className="mock-bar" style={{ height: '40%' }}></div>
                  <div className="mock-bar" style={{ height: '55%' }}></div>
                  <div className="mock-bar" style={{ height: '30%' }}></div>
                  <div className="mock-bar" style={{ height: '70%' }}></div>
                  <div className="mock-bar" style={{ height: '60%' }}></div>
                  <div className="mock-bar" style={{ height: '100%' }}></div>
                </div>
                <p className="perf-insight-text">"Communication clarity is up by 14% this month."</p>
              </div>

              <div className="perf-card" style={{ border: '1px solid #bfdbfe', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Star size={16} color="#005af0" />
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>AI Suggestion</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
                  Focus on your <span style={{ background: '#e0e7ff', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '0.8rem' }}>Technical Articulation</span>. Your sentiment analysis shows a slight dip in confidence when explaining complex algorithms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
