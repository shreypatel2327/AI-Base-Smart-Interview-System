import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Sparkles, Loader2, LogOut, User } from 'lucide-react';
import api from '../services/api';
import { createOrder, verifyPayment, reportFailure } from '../services/paymentService';

const Pricing = () => {
  const [user, setUser] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) setUser(data.data);
    } catch (err) {
      console.error('Failed to fetch user', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    navigate('/auth');
  };

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <Loader2 className="pulse" size={48} color="#005af0" />
      </div>
    );
  }

  const isPro = user?.plan === 'pro';

  return (
    <div className="pricing-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .pricing-page {
          background-color: #ffffff;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          color: #1a1a1a;
          display: flex;
          flex-direction: column;
        }

        /* Top Nav */
        .pricing-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          border-bottom: 1px solid #f1f1f1;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #0046c4;
          font-weight: 700;
          font-size: 1.2rem;
          text-decoration: none;
        }

        .nav-links-center {
          display: flex;
          gap: 40px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .nav-link {
          text-decoration: none;
          color: #666;
          font-weight: 500;
          font-size: 0.95rem;
          transition: color 0.2s;
        }

        .nav-link:hover, .nav-link.active {
          color: #1a1a1a;
        }
        
        .nav-link.active {
          border-bottom: 2px solid #005af0;
          padding-bottom: 4px;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-profile {
          color: #666;
          text-decoration: none;
          font-weight: 500;
        }

        .btn-logout {
          background-color: #eeeff1;
          color: #1a1a1a;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-logout:hover {
          background-color: #e2e4e7;
        }

        /* Hero Section */
        .hero {
          text-align: center;
          padding: 80px 20px 60px;
          max-width: 800px;
          margin: 0 auto;
        }

        .hero h1 {
          font-size: 4rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -1.5px;
        }

        .hero h1 span.luminary {
          color: #005af0;
          background: linear-gradient(to right, #005af0, #0046c4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero p {
          color: #666;
          font-size: 1.1rem;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Pricing Cards */
        .pricing-grid {
          display: flex;
          justify-content: center;
          gap: 30px;
          padding: 0 20px 80px;
          flex-wrap: wrap;
        }

        .price-card {
          background: #ffffff;
          border: 1px solid #f1f1f1;
          border-radius: 24px;
          padding: 40px;
          width: 440px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .price-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
        }

        .price-card.pro {
          background-color: #eceefc;
          border-color: #e0e4f9;
        }

        .recommended-badge {
          position: absolute;
          top: -15px;
          right: 30px;
          background-color: #4338ca;
          color: white;
          padding: 6px 16px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .card-title {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .card-desc {
          color: #666;
          font-size: 0.95rem;
          margin-bottom: 40px;
          min-height: 40px;
        }

        .price-value {
          margin-bottom: 40px;
        }

        .price-value .big {
          font-size: 3rem;
          font-weight: 800;
        }

        .price-value .small {
          color: #666;
          font-size: 1rem;
          font-weight: 500;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0 0 50px 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.05rem;
          font-weight: 500;
          color: #222;
          position: relative;
        }

        .feature-item.highlight {
          padding-left: 10px;
        }

        .feature-item.highlight::before {
          content: "";
          position: absolute;
          left: -15px;
          top: 0;
          bottom: 0;
          width: 3px;
          background-color: #005af0;
          border-radius: 4px;
        }

        .check-icon {
          color: #10b981;
          background: #ecfdf5;
          padding: 4px;
          border-radius: 50%;
        }

        .pro .check-icon {
          background: #d1fae5;
        }

        .btn-plan {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          margin-top: auto;
        }

        .btn-current {
          background-color: #eeeff1;
          color: #666;
          cursor: default;
        }

        .btn-upgrade {
          background-color: #0046c4;
          color: white;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
        }

        .btn-upgrade:hover {
          background-color: #4338ca;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
        }

        /* Trusted Section */
        .trusted {
          text-align: center;
          padding-top: 40px;
        }

        .trusted-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 24px;
        }

        .trusted-logos {
          display: flex;
          justify-content: center;
          gap: 30px;
        }

        .logo-box {
          width: 140px;
          height: 48px;
          background-color: #f5f6f7;
          border-radius: 8px;
        }

        /* Footer */
        .footer {
          margin-top: auto;
          padding: 40px;
          border-top: 1px solid #f1f1f1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #fafbfc;
        }

        .footer-brand {
          font-weight: 800;
          font-size: 1.2rem;
          color: #1a1a1a;
        }

        .footer-links {
          display: flex;
          gap: 30px;
        }

        .footer-link {
          text-decoration: none;
          color: #666;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .copyright {
          color: #999;
          font-size: 0.85rem;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        @media (max-width: 1000px) {
          .pricing-grid {
            flex-direction: column;
            align-items: center;
          }
          .price-card {
            width: 100%;
            max-width: 440px;
          }
          .hero h1 {
            font-size: 3rem;
          }
        }
      ` }} />

      {/* Nav */}
      {/* 
      <nav className="pricing-nav">
        <Link to="/" className="nav-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
            <path d="M12 12L2.1 10.1"></path>
            <path d="M16 22l-4-10 4-10"></path>
          </svg>
          AI Interview
        </Link>
        <div className="nav-links-center">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/pricing" className="nav-link active">Pricing</Link>
        </div>
        <div className="nav-right">
          <Link to="/dashboard" className="nav-profile">Profile</Link>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      */}

      {/* Hero */}
      <div className="hero">
        <h1>Invest in your <span className="luminary">luminary</span> future.</h1>
        <p>Choose the level of intelligence you need. Whether you're preparing for a single pivotal moment or a continuous career ascent, we have a plan designed for you.</p>
      </div>

      {/* Cards */}
      <div className="pricing-grid">
        {/* Free Card */}
        <div className="price-card">
          <h2 className="card-title">FREE</h2>
          <p className="card-desc">Essential tools to get a taste of AI-driven preparation.</p>
          
          <div className="price-value">
            <span className="big">$0</span>
            <span className="small"> / forever</span>
          </div>

          <ul className="feature-list">
            <li className="feature-item">
              <Check className="check-icon" size={24} strokeWidth={3} />
              1 interview session
            </li>
            <li className="feature-item">
              <Check className="check-icon" size={24} strokeWidth={3} />
              Basic performance feedback
            </li>
            <li className="feature-item">
              <Check className="check-icon" size={24} strokeWidth={3} />
              Standard question bank
            </li>
          </ul>

          <button className="btn-plan btn-current" disabled>
            {isPro ? 'Lower Tier' : 'Current Plan'}
          </button>
        </div>

        {/* Pro Card */}
        <div className="price-card pro">
          <div className="recommended-badge">Recommended</div>
          <h2 className="card-title">
            PRO <Sparkles size={24} color="#005af0" fill="#005af0" />
          </h2>
          <p className="card-desc">Unrestricted access for comprehensive career development.</p>

          <div className="price-value">
            <span className="big">$29</span>
            <span className="small"> / month</span>
          </div>

          <ul className="feature-list">
            <li className="feature-item">
              <Check className="check-icon" size={24} strokeWidth={3} />
              Unlimited interview sessions
            </li>
            <li className="feature-item highlight">
              <Check className="check-icon" size={24} strokeWidth={3} />
              Full AI analytical report
            </li>
            <li className="feature-item">
              <Check className="check-icon" size={24} strokeWidth={3} />
              Priority human-in-the-loop support
            </li>
            <li className="feature-item">
              <Check className="check-icon" size={24} strokeWidth={3} />
              Industry-specific scenarios
            </li>
          </ul>

          <button 
            className={`btn-plan ${isPro ? 'btn-current' : 'btn-upgrade'}`} 
            onClick={!isPro ? handleUpgrade : undefined}
            disabled={isPro || isProcessingPayment}
          >
            {isProcessingPayment ? <Loader2 className="pulse" size={20} /> : (isPro ? 'Current Plan' : 'Upgrade Now')}
          </button>
        </div>
      </div>

      {/* Trusted By */}
      <div className="trusted">
        <div className="trusted-label">Trusted by candidates securing roles at</div>
        <div className="trusted-logos">
          <div className="logo-box"></div>
          <div className="logo-box"></div>
          <div className="logo-box"></div>
          <div className="logo-box"></div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">AI Interview</div>
        <div className="footer-links">
          <Link to="/" className="footer-link">Privacy Policy</Link>
          <Link to="/" className="footer-link">Terms of Service</Link>
          <Link to="/" className="footer-link">Contact Support</Link>
        </div>
        <div className="copyright">© 2024 AI INTERVIEW. THE DIGITAL LUMINARY EXPERIENCE.</div>
      </footer>
    </div>
  );
};

export default Pricing;
