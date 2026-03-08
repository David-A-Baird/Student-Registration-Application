import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import SignUp from './pages/signUp.tsx';
import Header from './assets/Header';
import Footer from './assets/Footer';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <nav>
          <ul>
            <li><Link to="/SignUp">Sign Up</Link></li>
          </ul>
        </nav>
        <Routes>
          <Route path="/SignUp" element={<SignUp />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App