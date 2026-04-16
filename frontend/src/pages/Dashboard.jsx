import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Play, History, Loader2 } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [activeResume, setActiveResume] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterviews();
    fetchActiveResume();
  }, []);

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
      alert(err.response?.data?.message || "Failed to start interview");
    } finally {
      setIsUploading(false);
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
            disabled={!activeResume || isUploading}
          >
            {isUploading ? <><Loader2 className="pulse" size={18} /> Processing...</> : "Start Interview Simulator"}
          </button>
        </div>

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
