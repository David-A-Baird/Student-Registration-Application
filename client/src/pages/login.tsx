import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LogIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('http://localhost:8080/LogIn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        // store user in localStorage for simple client-side session
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        // prefer server-suggested redirect, otherwise navigate by role
        if (data.redirect) {
          navigate(data.redirect);
        } else if (data.user && data.user.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/Profile');
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Login failed' }));
        setError(err.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  return (
    <div>
      <h2>Log In</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            name="username"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            name="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <button type="submit">Log In</button>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default LogIn;