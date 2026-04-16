import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Hexagon, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userName, setUserName] = useState(localStorage.getItem('userName'));

  // Sync auth state when location changes or on mount
  useEffect(() => {
    setToken(localStorage.getItem('token'));
    setUserName(localStorage.getItem('userName'));
  }, [location]);

  // Listen for storage events (e.g., from other tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
      setUserName(localStorage.getItem('userName'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setToken(null);
    setUserName(null);
    navigate('/auth');
  };

  return (
    <nav style={styles.nav} className="glass-panel">
      <div style={styles.navContainer} className="container">
        <Link to="/" style={styles.brand}>
          <div style={styles.logoIconBg}><Hexagon size={16} color="#fff" /></div>
          <span>The Intelligent Layer</span>
        </Link>
        
        {/* Center Links (Visible only on desktop ideally, but we'll show them) */}
        {!token && (
          <div style={styles.centerNav}>
            <Link to="/" style={styles.navLinkItem}>Platform</Link>
            <Link to="/" style={styles.navLinkItem}>Resources</Link>
            <Link to="/pricing" style={styles.navLinkItem}>Pricing</Link>
          </div>
        )}

        <div style={styles.navLinks}>
          {token ? (
            <>
              <Link to="/dashboard" style={styles.navItem}>
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <div style={{ margin: '0 10px', color: 'var(--text-muted)' }}>
                Hi, {userName || 'Candidate'}
              </div>
              <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '6px 16px' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
             <>
               <Link to="/auth" style={styles.navLinkItem}>Login</Link>
               <Link to="/auth" style={styles.btnNavPrimary}>Get Started</Link>
             </>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    width: '100%',
    zIndex: 1000,
    borderRadius: 0,
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    background: '#ffffff',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  },
  navContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '70px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.2rem',
    fontWeight: '700',
    textDecoration: 'none',
    color: '#0f172a',
    fontFamily: '"Inter", sans-serif'
  },
  logoIconBg: {
    background: '#005af0',
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  centerNav: {
    display: 'flex',
    gap: '30px',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)'
  },
  navLinkItem: {
    color: '#475569',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  btnNavPrimary: {
    backgroundColor: '#005af0',
    color: '#fff',
    padding: '8px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#0f172a',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'color 0.3s'
  }
};

export default Navbar;
