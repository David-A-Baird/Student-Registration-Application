import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
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