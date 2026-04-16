import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import InterviewRoom from './pages/InterviewRoom';
import Report from './pages/Report';
import ResetPassword from './pages/ResetPassword';
import Pricing from './pages/Pricing';

// Simple PrivateRoute wrapper
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  
  console.log('[PrivateRoute Debug]', { storageToken: !!token, urlToken: !!urlToken });
  
  return (token || urlToken) ? children : <Navigate to="/auth" />;
};

const NavbarWrapper = () => {
  const location = useLocation();
  const hideNavbarRoutes = ["/interview"];
  const shouldHideNavbar = hideNavbarRoutes.some(route => location.pathname.startsWith(route));
  
  if (shouldHideNavbar) return null;
  return <Navbar />;
};

function App() {
  return (
    <Router>
      <NavbarWrapper />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/interview/:id"
            element={
              <PrivateRoute>
                <InterviewRoom />
              </PrivateRoute>
            }
          />
          <Route
            path="/report/:id"
            element={
              <PrivateRoute>
                <Report />
              </PrivateRoute>
            }
          />
          <Route
            path="/pricing"
            element={<Pricing />}
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
