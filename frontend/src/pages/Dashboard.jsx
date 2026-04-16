import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Play, History, Loader2 } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterviews();
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStartInterview = async () => {
    if (!file) {
      alert("Please upload your resume first.");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload Resume
      const formData = new FormData();
      formData.append('resume', file);
      const uploadRes = await api.post('/interviews/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const resumeId = uploadRes.data.data.resumeId;

      // 2. Start Interview
      const startRes = await api.post('/interviews/start', { resumeId });
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
              onChange={handleFileChange}
            />
            <label htmlFor="resume-upload" style={styles.uploadLabel}>
              <Upload size={24} style={{ marginBottom: '10px', color: 'var(--primary)' }} />
              <span style={{ fontWeight: '500' }}>{file ? file.name : "Click to upload resume (PDF)"}</span>
              {!file && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Max size 5MB</span>}
            </label>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '20px' }} 
            onClick={handleStartInterview}
            disabled={!file || isUploading}
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
