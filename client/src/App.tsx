import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import SignUp from './pages/signUp.tsx';
import LogIn from './pages/login';
import Profile from './pages/Profile';
import Admin from './pages/Admin.tsx';
import Header from './assets/Header';
import Footer from './assets/Footer';
import './App.css';

function App() {
  const raw = localStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  // Theme: 'light' | 'dark'
  const [theme, setTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
    // apply as data attribute so CSS can override variables
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <Router>
      <div className="App">
        <Header />
        <nav>
          <ul>
            <li><Link to="/SignUp">Sign Up</Link></li>
            <li><Link to="/login">Log In</Link></li>
            <li><Link to="/Profile">Profile</Link></li>
            {user && user.isAdmin && <li><Link to="/admin">Admin</Link></li>}
          </ul>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={toggleTheme} aria-label="Toggle theme">{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</button>
          </div>
        </nav>
        <Routes>
          <Route path="/SignUp" element={<SignUp />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/" element={<LogIn />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App