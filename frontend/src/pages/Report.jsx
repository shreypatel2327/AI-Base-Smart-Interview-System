import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Globe, LogOut, User, Settings, BarChart3, CheckCircle2, 
  AlertCircle, Download, Share, FileText, ChevronRight,
  MessageSquare, Users, ClipboardList, Lightbulb, Loader2
} from 'lucide-react';
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <Loader2 className="pulse" size={48} color="#2563eb" style={{ marginBottom: '20px' }} />
        <h2 style={{ color: '#0f172a', fontFamily: 'Inter' }}>Compiling Evaluation...</h2>
        <p style={{ color: '#64748b', fontFamily: 'Inter' }}>Structuring multi-dimensional candidate insights.</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <AlertCircle color="#ef4444" size={48} style={{ marginBottom: '20px' }} />
        <h3 style={{ color: '#0f172a', fontFamily: 'Inter' }}>Evaluation Pending</h3>
        <p style={{ color: '#64748b', marginBottom: '20px', fontFamily: 'Inter' }}>{error}</p>
        <button 
          style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }} 
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Formatting actual backend score (assuming 1-10) to 1-100 percentage.
  const scoreBase100 = Math.round((report.score || 0) * 10);
  const strokeDashoffset = 283 - (283 * scoreBase100) / 100;

  // Mock Sentiment Timeline Data
  const timelineData = [35, 40, 50, 55, 60, 48, 30, 20, 40, 58, 65, 62, 48, 40, 20, 38, 55, 60, 65, 55, 45];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        :root {
          --bg-light: #F8FAFC;
          --card-bg: #FFFFFF;
          --text-main: #0F172A;
          --text-light: #64748B;
          --border-color: #E2E8F0;
          --primary-blue: #2563EB;
          --primary-blue-hover: #1D4ED8;
          --success-green: #10B981;
          --warning-orange: #F59E0B;
        }

        body, html {
          background-color: var(--bg-light);
          font-family: 'Inter', sans-serif;
          color: var(--text-main);
          margin: 0;
          padding: 0;
        }

        /* Override global dark backgrounds if any remain */
        #root {
          background-color: var(--bg-light);
        }

        /* Top App Navigation */
        .app-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 40px;
          background: #fff;
          border-bottom: 1px solid var(--border-color);
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 40px;
        }

        .nav-logo {
          font-weight: 700;
          color: var(--primary-blue);
          font-size: 1.1rem;
        }

        .nav-links {
          display: flex;
          gap: 24px;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-light);
        }

        .nav-links span {
          cursor: pointer;
        }

        .nav-links .active {
          color: var(--primary-blue);
          border-bottom: 2px solid var(--primary-blue);
          padding-bottom: 2px;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
          color: var(--text-light);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: #DBEAFE;
          color: #1E40AF;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Side Toolbar structure */
        .report-layout {
          display: flex;
          min-height: calc(100vh - 65px);
        }

        .side-toolbar {
          width: 60px;
          background: #fff;
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 24px;
          gap: 24px;
          color: var(--text-light);
        }

        .toolbar-icon {
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
        }
        .toolbar-icon.active {
          background: #EFF6FF;
          color: var(--primary-blue);
        }

        /* Main Content Container */
        .content-container {
          flex: 1;
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Breadcrumbs & Header */
        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-light);
          margin-bottom: 24px;
        }

        .breadcrumbs .current {
          color: var(--primary-blue);
          font-weight: 600;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
        }

        .header-title h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .header-title p {
          color: var(--text-light);
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0;
          max-width: 600px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-outline {
          background: #F1F5F9;
          border: 1px solid var(--border-color);
          color: var(--text-main);
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 50px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .btn-primary {
          background: var(--primary-blue);
          border: none;
          color: white;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 50px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        /* Grid Layout */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
        }

        .card {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
        }

        /* Left Column Content */
        .score-card {
          text-align: center;
          margin-bottom: 24px;
        }

        .score-card h3 {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 24px 0;
        }

        .circular-progress {
          position: relative;
          width: 180px;
          height: 180px;
          margin: 0 auto 20px;
        }

        .circular-svg {
          transform: rotate(-90deg);
          width: 100%;
          height: 100%;
        }

        .circle-bg {
          fill: none;
          stroke: #F1F5F9;
          stroke-width: 8;
        }

        .circle-prog {
          fill: none;
          stroke: #0A32DB; /* Deep blue from image */
          stroke-width: 8;
          stroke-linecap: round;
          stroke-dasharray: 283;
          transition: stroke-dashoffset 1s ease-in-out;
        }

        .score-value {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .score-value span:first-child {
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1;
        }

        .score-value span:last-child {
          font-size: 0.9rem;
          color: var(--text-light);
          font-weight: 500;
        }

        .strong-candidate-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #EFF6FF;
          color: var(--primary-blue);
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        /* Competency Breakdown */
        .competency-card h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0 0 24px 0;
        }

        .comp-row {
          margin-bottom: 20px;
        }

        .comp-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .comp-name { color: var(--text-main); }
        .comp-val { color: var(--primary-blue); }

        .comp-bar-bg {
          height: 6px;
          background: #F1F5F9;
          border-radius: 4px;
          overflow: hidden;
        }

        .comp-bar-fill {
          height: 100%;
          background: var(--primary-blue);
          border-radius: 4px;
        }

        /* Right Column Content */
        .right-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Executive Summary */
        .summary-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--primary-blue);
          margin-bottom: 16px;
        }

        .summary-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #334155;
          margin-bottom: 30px;
        }

        .strengths-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .points-col {
          border-left: 2px solid;
          padding-left: 20px;
        }

        .points-col.pos {
          border-color: var(--success-green);
        }

        .points-col.neg {
          border-color: var(--warning-orange);
        }

        .points-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 16px;
          letter-spacing: 0.5px;
        }
        .points-col.pos .points-title { color: var(--success-green); }
        .points-col.neg .points-title { color: var(--warning-orange); }

        .point-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
          font-size: 0.85rem;
          line-height: 1.5;
          color: #334155;
        }

        .point-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Timeline Chart */
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .timeline-header h3 {
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
        }

        .legend {
          display: flex;
          gap: 16px;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 6px; height: 6px; border-radius: 50%;
        }

        .chart-container {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 120px;
          margin-bottom: 10px;
        }

        .chart-bar {
          flex: 1;
          background: #DBEAFE;
          border-radius: 2px 2px 0 0;
          min-height: 10px;
          transition: height 0.3s;
        }

        .chart-bar:hover {
          background: #93C5FD;
        }

        .chart-bar.low {
          background: #93C5FD;
        }

        .chart-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: var(--text-light);
        }

        /* Bottom Section Grid */
        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }

        .bottom-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 24px;
        }

        .quote-box {
          background: #F8FAFC;
          border-left: 3px solid var(--primary-blue);
          padding: 20px;
          border-radius: 0 8px 8px 0;
          margin-bottom: 16px;
        }

        .quote-text {
          font-size: 0.9rem;
          line-height: 1.5;
          color: #334155;
          font-style: italic;
          margin-bottom: 12px;
        }

        .quote-src {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-light);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .next-step-item {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .step-icon-wrap {
          width: 40px;
          height: 40px;
          background: #F1F5F9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-blue);
          flex-shrink: 0;
        }

        .step-text h4 {
          margin: 0 0 4px 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .step-text p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-light);
        }

      `}} />

      {/* Top Application Nav */}
      <nav className="app-nav">
        <div className="nav-left">
          <div className="nav-logo">The Intelligent Layer</div>
          <div className="nav-links">
            <span onClick={() => navigate('/dashboard')}>Dashboard</span>
            <span className="active">Interviews</span>
            <span>Talent Pool</span>
            <span>Settings</span>
          </div>
        </div>
        <div className="nav-right">
          <Globe size={18} />
          <LogOut size={18} />
          <div className="user-avatar"><User size={18} /></div>
        </div>
      </nav>

      <div className="report-layout">
        {/* Left Toolbar */}
        <div className="side-toolbar">
          <div className="toolbar-icon active"><FileText size={20} /></div>
          <div className="toolbar-icon"><Lightbulb size={20} /></div>
          <div className="toolbar-icon"><BarChart3 size={20} /></div>
        </div>

        {/* Main Workspace */}
        <div className="content-container animate-fade-in">
          
          <div className="breadcrumbs">
            <span>Interviews</span>
            <ChevronRight size={14} />
            <span>Candidates</span>
            <ChevronRight size={14} />
            <span className="current">Result Report</span>
          </div>

          <div className="header-section">
            <div className="header-title">
              <h1>Candidate Evaluation: Alex Rivera</h1>
              <p>Detailed AI-driven synthesis of the Senior Product Designer interview session conducted on Oct 24, 2023.</p>
            </div>
            <div className="header-actions">
              <button className="btn-outline">Download PDF</button>
              <button className="btn-primary">Share Report</button>
            </div>
          </div>

          <div className="dashboard-grid">
            
            {/* Left Column */}
            <div className="left-col">
              
              <div className="card score-card">
                <h3>Overall Match Score</h3>
                <div className="circular-progress">
                  <svg className="circular-svg" viewBox="0 0 100 100">
                    <circle className="circle-bg" cx="50" cy="50" r="45" />
                    <circle className="circle-prog" cx="50" cy="50" r="45" style={{ strokeDashoffset }} />
                  </svg>
                  <div className="score-value">
                    <span>{scoreBase100}</span>
                    <span>/ 100</span>
                  </div>
                </div>
                <div className="strong-candidate-badge">
                  <span style={{ fontSize: '14px' }}>★</span> Strong Candidate
                </div>
              </div>

              <div className="card competency-card">
                <h3>Competency Breakdown</h3>
                
                <div className="comp-row">
                  <div className="comp-header">
                    <span className="comp-name">Communication</span>
                    <span className="comp-val">92%</span>
                  </div>
                  <div className="comp-bar-bg">
                    <div className="comp-bar-fill" style={{ width: '92%' }}></div>
                  </div>
                </div>
                
                <div className="comp-row">
                  <div className="comp-header">
                    <span className="comp-name">Confidence</span>
                    <span className="comp-val">78%</span>
                  </div>
                  <div className="comp-bar-bg">
                    <div className="comp-bar-fill" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <div className="comp-row">
                  <div className="comp-header">
                    <span className="comp-name">Technical Clarity</span>
                    <span className="comp-val">85%</span>
                  </div>
                  <div className="comp-bar-bg">
                    <div className="comp-bar-fill" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div className="comp-row">
                  <div className="comp-header">
                    <span className="comp-name">Sentiment Balance</span>
                    <span className="comp-val">88%</span>
                  </div>
                  <div className="comp-bar-bg">
                    <div className="comp-bar-fill" style={{ width: '88%' }}></div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="right-col">
              
              <div className="card">
                <div className="summary-header">
                  <SparkleIcon />
                  AI Insight Executive Summary
                </div>
                <p className="summary-text">
                  Alex demonstrates a high degree of emotional intelligence and structured thinking. 
                  Their responses regarding system design show deep architectural knowledge, 
                  though there was a slight hesitation when discussing legacy migration strategies. 
                  Communication is exceptionally clear, utilizing visual metaphors effectively during verbal explanations.
                </p>

                <div className="strengths-grid">
                  <div className="points-col pos">
                    <div className="points-title">Key Strengths</div>
                    
                    {report.strengths && report.strengths.length > 0 ? report.strengths.map((str, i) => (
                      <div className="point-item" key={i}>
                        <CheckCircle2 color="var(--success-green)" size={16} className="point-icon" />
                        <span>{str}</span>
                      </div>
                    )) : (
                      <>
                        <div className="point-item">
                          <CheckCircle2 color="var(--success-green)" size={16} className="point-icon" />
                          <span>Articulate design-to-code handoff processes</span>
                        </div>
                        <div className="point-item">
                          <CheckCircle2 color="var(--success-green)" size={16} className="point-icon" />
                          <span>Strong focus on user accessibility and inclusivity</span>
                        </div>
                        <div className="point-item">
                          <CheckCircle2 color="var(--success-green)" size={16} className="point-icon" />
                          <span>Maintains high positive sentiment under pressure</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="points-col neg">
                    <div className="points-title">Growth Areas</div>
                    {report.weaknesses && report.weaknesses.length > 0 ? report.weaknesses.map((wk, i) => (
                      <div className="point-item" key={i}>
                        <AlertCircle color="var(--warning-orange)" size={16} className="point-icon" />
                        <span>{wk}</span>
                      </div>
                    )) : (
                      <>
                        <div className="point-item">
                          <AlertCircle color="var(--warning-orange)" size={16} className="point-icon" />
                          <span>Clarify experience with large-scale data migrations</span>
                        </div>
                        <div className="point-item">
                          <AlertCircle color="var(--warning-orange)" size={16} className="point-icon" />
                          <span>Tends to over-explain simple technical concepts</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="timeline-header">
                  <h3>Session Sentiment Timeline</h3>
                  <div className="legend">
                    <div className="legend-item"><div className="legend-dot" style={{background: '#2563EB'}}></div> High Energy</div>
                    <div className="legend-item"><div className="legend-dot" style={{background: '#93C5FD'}}></div> Neutral</div>
                  </div>
                </div>
                <div className="chart-container">
                  {timelineData.map((val, i) => (
                    <div 
                      key={i} 
                      className={`chart-bar ${val < 40 ? 'low' : ''}`} 
                      style={{ height: `${val}%`, opacity: val < 40 ? 0.6 : 1 }}
                    ></div>
                  ))}
                </div>
                <div className="chart-labels">
                  <span>0:00 (Start)</span>
                  <span>15:00</span>
                  <span>30:00</span>
                  <span>45:00 (End)</span>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Row inside content container */}
          <div className="bottom-grid">
            
            <div className="card">
              <div className="bottom-card-header">
                <Lightbulb color="var(--primary-blue)" size={20} />
                Technical Depth Analysis
              </div>
              
              <div className="quote-box">
                <div className="quote-text">
                  "The candidate's explanation of React concurrency patterns was precise and demonstrated actual production experience rather than theoretical knowledge."
                </div>
                <div className="quote-src">Source: Transcript Segment 12:45</div>
              </div>

              <div className="quote-box" style={{ background: '#F8FAFC', borderLeft: '3px solid #E2E8F0', color: '#64748B' }}>
                <div className="quote-text" style={{ color: '#64748B' }}>
                  "Question on CI/CD pipelines was answered correctly but lacked specific details on container orchestration which may require a follow-up."
                </div>
                <div className="quote-src">Source: Transcript Segment 28:10</div>
              </div>
            </div>

            <div className="card">
              <div className="bottom-card-header">
                <MessageSquare color="var(--primary-blue)" size={20} />
                Next Steps Recommended
              </div>

              <div className="next-step-item">
                <div className="step-icon-wrap"><Users size={20} /></div>
                <div className="step-text">
                  <h4>Schedule Final Interview</h4>
                  <p>Recommended with the Head of Engineering.</p>
                </div>
              </div>

              <div className="next-step-item">
                <div className="step-icon-wrap"><ClipboardList size={20} /></div>
                <div className="step-text">
                  <h4>Release Assessment Link</h4>
                  <p>Systems Architecture Design Challenge.</p>
                </div>
              </div>

              <div className="next-step-item">
                <div className="step-icon-wrap"><MessageSquare size={20} /></div>
                <div className="step-text">
                  <h4>Peer Review</h4>
                  <p>Gather feedback from the Lead Designer.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
};

// Tiny helper for the specific four-point star in the summary header
const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
  </svg>
)

export default Report;
