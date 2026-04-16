import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Zap, MessageSquare, BarChart2 } from 'lucide-react';

const Home = () => {
  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
      .home-wrapper {
        background-color: #0a0d14;
        min-height: 100vh;
        width: 100%;
        font-family: "Inter", sans-serif;
        color: #fff;
        overflow-x: hidden;
      }
      .section-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 5%;
      }
      .hero-title {
        font-size: clamp(2.5rem, 6vw, 4.8rem);
        font-weight: 800;
        line-height: 1.1;
        margin-bottom: 20px;
        letter-spacing: -1px;
      }
      .features-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }
      .steps-flex {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .step-line {
        flex: 0.5;
        height: 1px;
        background-color: #334155;
        margin-top: 20px;
      }
      .mockup-box {
        position: relative;
        width: 100%;
        min-height: 400px;
        background: linear-gradient(145deg, #1e293b, #0f172a);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.05);
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      }
      @media (max-width: 1024px) {
        .features-grid { grid-template-columns: repeat(2, 1fr); }
        .span-2 { grid-column: span 2; }
      }
      @media (max-width: 768px) {
        .features-grid { grid-template-columns: 1fr; }
        .span-2 { grid-column: span 1 !important; }
        .steps-flex { flex-direction: column; align-items: center; gap: 40px; }
        .step-line { display: none; }
        .cta-buttons { flex-direction: column; width: 100%; }
        .cta-buttons a { width: 100%; text-align: center; }
        .mockup-box { min-height: 300px; }
        .float-card-left, .float-card-right { 
           position: static !important; width: 100% !important; margin-top: 10px; max-width: 100% !important;
        }
      }
    `}} />
    <div className="home-wrapper">
      
      {/* 1. Navbar placeholder */}
      <div style={styles.topNavPlaceholder}></div>

      {/* Hero Section */}
      <section className="section-container" style={styles.hero}>
        <div style={styles.badge}>
          ELEVATE YOUR CAREER
        </div>
        
        <h1 className="hero-title">
          AI-Powered<br/>
          <span style={styles.textGradient}>Smart Interview Platform</span>
        </h1>
        
        <p style={styles.subheadline}>
          Practice real-world interviews with our advanced AI. Receive instant,<br/>
          actionable feedback to sharpen your skills and land your dream job.
        </p>
        
        <div className="cta-buttons" style={styles.ctaGroup}>
          <Link to="/auth" style={styles.btnPrimary}>Start Interview</Link>
          <a href="#how-it-works" style={styles.btnSecondary}>View Demo</a>
        </div>

        {/* Hero Pseudo-Mockup */}
        <div className="mockup-box">
          
          <div style={{ padding: '40px', fontFamily: 'monospace', color: '#64748b', fontSize: '0.9rem', textAlign: 'left', opacity: 0.6 }}>
             // function simulateRealInterview() &#123;<br/>
             // &nbsp;&nbsp;await analyzeCandidate();<br/>
             // &nbsp;&nbsp;return generateFeedback();<br/>
             // &#125;
          </div>

          {/* Floating evaluation card */}
          <div className="float-card-left" style={styles.floatCardLeft}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <CheckCircle size={14} color="#10b981" />
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981', letterSpacing: '1px' }}>A.I. EVALUATION</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: 0, lineHeight: '1.4' }}>
              "Candidate demonstrated strong logic and systems thinking in the architectural response."
            </p>
          </div>

          {/* Floating success rate */}
          <div className="float-card-right" style={styles.floatCardRight}>
             <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#a855f7', display: 'block', lineHeight: '1.1' }}>92%</span>
             <span style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '1px' }}>SUCCESS RATE</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-container" style={styles.featuresSection}>
        <div style={{ marginBottom: '50px' }}>
          <h2 style={styles.sectionTitle}>Precision-Engineered Preparation</h2>
          <p style={styles.sectionSubtitle}>
            Our features are designed to mimic real-world technical and behavioral<br/>
            assessments with surgical precision.
          </p>
        </div>

        <div className="features-grid">
          {/* AI Questions Card */}
          <div className="span-2" style={styles.featureCard}>
             <div style={{ marginBottom: '20px' }}>
               <div style={styles.iconCircleDark}>
                 <MessageSquare size={18} color="#a855f7" />
               </div>
             </div>
             <h3 style={styles.cardTitle}>AI Questions</h3>
             <p style={styles.cardDesc}>
               Dynamically generated technical scenarios tailored to your<br/>
               specific role and experience level. No repetitive templates.
             </p>
             <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
               <span style={styles.tag}>Data</span>
               <span style={styles.tag}>System Design</span>
               <span style={styles.tag}>Behavioral</span>
             </div>
          </div>

          {/* Real-time Feedback Card */}
          <div style={{...styles.featureCard, ...styles.featureCardPurple}}>
             <div style={{ marginBottom: '20px' }}>
               <Zap size={24} color="#fff" />
             </div>
             <h3 style={{...styles.cardTitle, color: '#fff'}}>Real-time Feedback</h3>
             <p style={{...styles.cardDesc, color: 'rgba(255,255,255,0.8)'}}>
               Immediate analysis of your voice tone, body language, and technical accuracy as you speak.
             </p>
          </div>

          {/* Performance Report Card */}
          <div style={styles.featureCard}>
             <div style={{ marginBottom: '20px' }}>
               <div style={styles.iconCircleGreen}>
                 <BarChart2 size={18} color="#10b981" />
               </div>
             </div>
             <h3 style={styles.cardTitle}>Performance Report</h3>
             <p style={styles.cardDesc}>
               Granular analytics showing your growth over time across 12 distinct competency categories.
             </p>
          </div>

          {/* Cloud Sync Card */}
          <div className="span-2" style={{...styles.featureCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
             <div>
               <h3 style={styles.cardTitle}>Cloud Sync</h3>
               <p style={styles.cardDesc}>
                 Review your past recordings and AI insights from any<br/>
                 device, anywhere in the world.
               </p>
             </div>
          </div>

        </div>
      </section>

      {/* Steps Section */}
      <section className="section-container" style={styles.stepsSection}>
         <h2 style={{...styles.sectionTitle, textAlign: 'center'}}>The Road to Mastery</h2>
         <p style={{...styles.sectionSubtitle, textAlign: 'center', marginBottom: '60px'}}>
           Three simple steps to transform your interview performance from<br/>
           hesitant to confident.
         </p>

         <div className="steps-flex">
            <div style={styles.stepItem}>
               <div style={styles.stepCircle}>1</div>
               <h4 style={styles.stepTitle}>Choose Your Path</h4>
               <p style={styles.stepDesc}>Select from over 200 role-specific paths ranging from Frontend Engineer to Product Manager.</p>
            </div>
            
            <div className="step-line"></div>
            
            <div style={styles.stepItem}>
               <div style={styles.stepCircle}>2</div>
               <h4 style={styles.stepTitle}>Engage with AI</h4>
               <p style={styles.stepDesc}>Conduct a 45-minute live interview. Our AI listens, watches, and adapts to your specific answers.</p>
            </div>

            <div className="step-line"></div>

            <div style={styles.stepItem}>
               <div style={styles.stepCircle}>3</div>
               <h4 style={styles.stepTitle}>Iterate and Improve</h4>
               <p style={styles.stepDesc}>Review your detailed report, identify blind spots, and repeat the session to perfect your pitch.</p>
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="section-container" style={styles.ctaSection}>
         <div style={styles.ctaCard}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 'bold', marginBottom: '16px' }}>Ready to Ace the Final Round?</h2>
            <p style={{ color: '#94a3b8', marginBottom: '30px', fontSize: '1rem' }}>
              Join 15,000+ candidates who have already landed offers at top<br/>
              tech companies using SocraticAI.
            </p>
            <div className="cta-buttons" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
               <Link to="/auth" style={{...styles.btnPrimary, padding: '12px 32px'}}>Get Started for Free</Link>
               <a href="/pricing" style={styles.btnSecondaryDark}>Pricing Plans</a>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="section-container" style={styles.footer}>
         <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '20px' }}>SocraticAI</div>
         <div style={{ display: 'flex', gap: '20px', fontSize: '0.75rem', color: '#64748b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
            <span>Contact</span>
         </div>
         <div style={{ fontSize: '0.7rem', color: '#475569' }}>
            © 2024 SOCRATICAI. THE NEURO-SOCRATIC ENGINE SYSTEM.
         </div>
      </footer>

    </div>
    </>
  );
};

const styles = {
  topNavPlaceholder: {
    height: '60px' // accounts for fixed navbar
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '80px 0 40px',
  },
  badge: {
    display: 'inline-block',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: '6px 14px',
    borderRadius: '50px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    letterSpacing: '1px',
    marginBottom: '30px'
  },
  ctaGroup: {
    display: 'flex',
    gap: '16px',
    marginBottom: '60px'
  },
  btnPrimary: {
    backgroundColor: '#8b5cf6',
    backgroundImage: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    color: '#fff',
    padding: '12px 28px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'opacity 0.2s',
    border: 'none',
    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
  },
  btnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    padding: '12px 28px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  btnSecondaryDark: {
    backgroundColor: '#1e293b',
    color: '#fff',
    padding: '12px 28px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    border: '1px solid #334155'
  },
  floatCardLeft: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '16px',
    maxWidth: '350px',
    textAlign: 'left'
  },
  floatCardRight: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '16px 24px',
    textAlign: 'center'
  },
  featuresSection: {
    margin: '80px auto',
  },
  sectionTitle: {
    fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
    fontWeight: '700',
    marginBottom: '10px'
  },
  sectionSubtitle: {
    fontSize: '1rem',
    color: '#94a3b8',
    lineHeight: '1.6'
  },
  featureCard: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '30px',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column'
  },
  featureCardPurple: {
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    border: 'none'
  },
  iconCircleDark: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconCircleGreen: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    marginBottom: '12px'
  },
  cardDesc: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    lineHeight: '1.5'
  },
  tag: {
    fontSize: '0.7rem',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    padding: '4px 10px',
    borderRadius: '4px',
    color: '#e2e8f0',
    fontWeight: '500'
  },
  stepsSection: {
    margin: '100px auto',
  },
  stepItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '0 20px'
  },
  stepCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#334155',
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    marginBottom: '20px',
    zIndex: 2,
    position: 'relative'
  },
  stepTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '12px'
  },
  stepDesc: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    lineHeight: '1.6'
  },
  ctaSection: {
    margin: '100px auto',
  },
  ctaCard: {
    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: '24px',
    padding: '60px 20px',
    textAlign: 'center',
    border: '1px solid #334155'
  },
  footer: {
    borderTop: '1px solid #1e293b',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '60px'
  }
};

export default Home;
