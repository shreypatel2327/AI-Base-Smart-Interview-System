import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, CheckCircle, AlertTriangle, Lightbulb, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../services/api';

const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const { data } = await api.get(`/interviews/${id}/report`);
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      setError('Failed to load report. AI might still be generating it.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="pulse" size={48} color="var(--primary)" style={{ marginBottom: '20px' }} />
        <h2>Analyzing your performance...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Our AI is generating a comprehensive evaluation report.</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
          <AlertTriangle color="#f87171" size={48} style={{ marginBottom: '20px' }} />
          <h3>Error Loading Report</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const scoreColor = report.score >= 8 ? '#10b981' : report.score >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      <button 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '30px', fontSize: '1rem' }}
        onClick={() => navigate('/dashboard')}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div style={styles.header}>
        <div style={styles.scoreCircle}>
          <svg style={styles.svg} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle 
              cx="50" cy="50" r="45" fill="none" stroke={scoreColor} strokeWidth="8" 
              strokeDasharray={`${(report.score / 10) * 283} 283`}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 1.5s ease-out' }}
            />
          </svg>
          <div style={styles.scoreText}>
            <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{report.score}</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 10</span>
          </div>
        </div>
        
        <div>
          <h1 style={{ fontSize: '2.8rem', marginBottom: '10px' }}>Interview Complete</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
            Here is your AI-generated performance evaluation.
          </p>
        </div>
      </div>

      <div style={styles.grid}>
        
        <div className="glass-panel" style={{ ...styles.card, borderTop: '4px solid #10b981' }}>
          <div style={styles.cardHeader}>
            <CheckCircle color="#10b981" /> 
            <h3>Strengths</h3>
          </div>
          <ul style={styles.list}>
            {report.strengths?.map((item, i) => (
              <li key={i} style={styles.listItem}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="glass-panel" style={{ ...styles.card, borderTop: '4px solid #ef4444' }}>
          <div style={styles.cardHeader}>
            <AlertTriangle color="#ef4444" /> 
            <h3>Areas for Improvement</h3>
          </div>
          <ul style={styles.list}>
            {report.weaknesses?.map((item, i) => (
              <li key={i} style={styles.listItem}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="glass-panel" style={{ ...styles.card, borderTop: '4px solid #f59e0b', gridColumn: '1 / -1' }}>
          <div style={styles.cardHeader}>
            <Lightbulb color="#f59e0b" /> 
            <h3>Suggestions & Next Steps</h3>
          </div>
          <ul style={styles.list}>
            {report.suggestions?.map((item, i) => (
              <li key={i} style={styles.listItem}>{item}</li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    marginBottom: '50px',
    padding: '30px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '16px',
    border: '1px solid var(--glass-border)'
  },
  scoreCircle: {
    position: 'relative',
    width: '140px',
    height: '140px'
  },
  svg: {
    width: '100%',
    height: '100%'
  },
  scoreText: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-heading)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px'
  },
  card: {
    padding: '30px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },
  list: {
    listStylePosition: 'inside',
    color: 'var(--text-muted)'
  },
  listItem: {
    marginBottom: '10px',
    lineHeight: '1.6',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '10px'
  }
};

export default Report;
