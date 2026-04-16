import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Mic, FileText, Zap } from 'lucide-react';

const Home = () => {
  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '100px' }}>
      
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.badge} className="glass-panel">
          <Zap size={14} color="#ec4899" /> <span>Next Generation Recruiting</span>
        </div>
        <h1 style={styles.headline}>
          Master your next interview with <br/>
          <span className="text-gradient">Real-Time AI Practice</span>
        </h1>
        <p style={styles.subheadline}>
          Simulate real-world technical interviews driven by AI. Upload your resume, 
          answer dynamically generated questions, and get instant feedback to level up your career.
        </p>
        <div style={styles.ctaGroup}>
          <Link to="/auth" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
            Get Started For Free
          </Link>
          <a href="#how-it-works" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
            See How It Works
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" style={styles.features}>
        <h2 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2.5rem' }}>How it Works</h2>
        <div style={styles.grid}>
          
          <div className="glass-panel" style={styles.card}>
            <div style={{ ...styles.iconBox, background: 'rgba(99, 102, 241, 0.2)' }}>
              <FileText color="#8b5cf6" size={32} />
            </div>
            <h3>1. Upload Resume</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Our AI parses your PDF and understands your skills, experience, and background to tailor the interview.
            </p>
          </div>

          <div className="glass-panel" style={styles.card}>
            <div style={{ ...styles.iconBox, background: 'rgba(236, 72, 153, 0.2)' }}>
              <Bot color="#ec4899" size={32} />
            </div>
            <h3>2. Dynamic Questions</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              No hardcoded scripts. Questions adapt in real-time based on your previous answers and resume context.
            </p>
          </div>

          <div className="glass-panel" style={styles.card}>
            <div style={{ ...styles.iconBox, background: 'rgba(168, 85, 247, 0.2)' }}>
              <Mic color="#a855f7" size={32} />
            </div>
            <h3>3. Voice Enabled</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Answer naturally using your voice with built-in speech-to-text natively integrated into the browser.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};

const styles = {
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '120px 0 80px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px',
    borderRadius: '50px',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '30px',
    color: '#e2e8f0',
  },
  headline: {
    fontSize: '4.5rem',
    marginBottom: '24px',
    letterSpacing: '-1px',
  },
  subheadline: {
    fontSize: '1.2rem',
    color: 'var(--text-muted)',
    maxWidth: '700px',
    marginBottom: '40px',
    lineHeight: '1.8',
  },
  ctaGroup: {
    display: 'flex',
    gap: '20px',
  },
  features: {
    marginTop: '60px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
  },
  card: {
    padding: '40px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'transform 0.3s',
  },
  iconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px'
  }
};

export default Home;
