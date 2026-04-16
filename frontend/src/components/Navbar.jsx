import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('userName');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    navigate('/auth');
  };

  return (
    <nav style={styles.nav} className="glass-panel">
      <div style={styles.navContainer} className="container">
        <Link to="/" style={styles.brand}>
          <BrainCircuit color="#a855f7" size={28} />
          <span className="text-gradient">Smart Interview</span>
        </Link>
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
            <Link to="/auth" className="btn btn-primary">Sign In / Register</Link>
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
    fontSize: '1.4rem',
    fontWeight: 'bold',
    textDecoration: 'none',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-heading)'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-main)',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'color 0.3s'
  }
};

export default Navbar;
