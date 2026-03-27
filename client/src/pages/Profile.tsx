import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [className, setClassName] = useState('');
  const [classesResults, setClassesResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>({});
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      // not logged in
      navigate('/login');
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const handleClassNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClassName(e.target.value);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const startEditProfile = () => {
    setProfileData({
      username: user.username || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      address: user.address || '',
      phoneNumber: user.phoneNumber || ''
    });
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    setError(null);
    try {
      const payload: any = { ...profileData };
      // if password is empty, don't send it
      if (!payload.password) delete payload.password;
      const res = await axios.put(`http://localhost:8080/students/${user._id}`, payload);
      const updated = res.data.student;
      // update localStorage and local state
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setEditingProfile(false);
    } catch (err: any) {
      console.error('save profile error', err);
      setError(err?.response?.data?.error || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSearch = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8080/classSearch', { class: className });
      setClassesResults(res.data.results || []);
    } catch (err: any) {
      console.error('Search error', err);
      setError(err?.response?.data?.error || 'Search failed');
      setClassesResults([]);
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled = (cls: any) => {
    if (!cls || !cls.students) return false;
    return cls.students.some((s: any) => String(s._id || s) === String(user._id));
  };

  const enroll = async (classId: string) => {
    if (!user) return;
    setActionLoading((s) => ({ ...s, [classId]: true }));
    try {
      const res = await axios.put(`http://localhost:8080/classes/${classId}/enroll`, { studentId: user._id });
      const updated = res.data.class;
      setClassesResults((prev) => prev.map((c) => (String(c._id) === String(updated._id) ? updated : c)));
    } catch (err: any) {
      console.error('enroll error', err);
      setError(err?.response?.data?.error || 'Failed to enroll');
    } finally {
      setActionLoading((s) => ({ ...s, [classId]: false }));
    }
  };

  const unenroll = async (classId: string) => {
    if (!user) return;
    setActionLoading((s) => ({ ...s, [classId]: true }));
    try {
      const res = await axios.put(`http://localhost:8080/classes/${classId}/unenroll`, { studentId: user._id });
      const updated = res.data.class;
      setClassesResults((prev) => prev.map((c) => (String(c._id) === String(updated._id) ? updated : c)));
    } catch (err: any) {
      console.error('unenroll error', err);
      setError(err?.response?.data?.error || 'Failed to unenroll');
    } finally {
      setActionLoading((s) => ({ ...s, [classId]: false }));
    }
  };

  if (!user) return null;

  return (
    <div>
      <h2>Welcome, {user.username}!</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={handleLogout}>Log out</button>
        {!editingProfile ? (
          <button onClick={startEditProfile}>Edit Profile</button>
        ) : (
          <>
            <button onClick={saveProfile} disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setEditingProfile(false)} disabled={savingProfile}>Cancel</button>
          </>
        )}
      </div>

      {editingProfile && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Edit your profile</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <input value={profileData.username} onChange={(e) => setProfileData({ ...profileData, username: e.target.value })} placeholder="Username" />
            <input value={profileData.firstName} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} placeholder="First name" />
            <input value={profileData.lastName} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} placeholder="Last name" />
            <input value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} placeholder="Email" />
            <input value={profileData.address} onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} placeholder="Address" />
            <input value={profileData.phoneNumber} onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })} placeholder="Phone" />
            <input type="password" value={profileData.password || ''} onChange={(e) => setProfileData({ ...profileData, password: e.target.value })} placeholder="New password (leave blank to keep)" />
          </div>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>Search Classes:</label>
        <div className="small-controls">
          <input type="text" value={className} onChange={handleClassNameChange} placeholder="e.g. Algebra" />
          <button onClick={handleSearch} className="btn-primary">Search</button>
        </div>
      </div>
      {loading && <p className="muted">Searching...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <div style={{ marginTop: 16 }}>
        {classesResults.length === 0 && !loading && <p className="muted">No classes found.</p>}
        {classesResults.map((c) => (
          <div key={c._id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>{c.name} {c.code ? `(${c.code})` : ''}</h3>
                <p className="muted" style={{ margin: '4px 0' }}>{c.description}</p>
                <p className="muted" style={{ margin: '4px 0' }}>Room: {c.room || 'TBA'}</p>
                <p className="muted" style={{ margin: '4px 0' }}>Time: {c.startTime || 'TBA'} — {c.endTime || 'TBA'}</p>
                <p className="muted" style={{ margin: '4px 0' }}>Days: {(c.days && c.days.length) ? c.days.join(', ') : 'TBA'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="muted">Students: {c.students ? c.students.length : 0}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {isEnrolled(c) ? (
                    <button onClick={() => unenroll(c._id)} disabled={!!actionLoading[c._id]}> {actionLoading[c._id] ? 'Processing...' : 'Unenroll'}</button>
                  ) : (
                    <button onClick={() => enroll(c._id)} disabled={!!actionLoading[c._id]}> {actionLoading[c._id] ? 'Processing...' : 'Enroll'}</button>
                  )}
                  <button onClick={() => setExpanded((s) => ({ ...s, [c._id]: !s[c._id] }))}>{expanded[c._id] ? 'Hide' : 'View'} Students</button>
                </div>
              </div>
            </div>
            {expanded[c._id] && (
              <div style={{ marginTop: 12 }}>
                {c.students && c.students.length ? c.students.map((s: any) => (
                  <div key={s._id} style={{ padding: 6, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <strong>{s.username}</strong> — <span className="muted">{s.email}</span>
                  </div>
                )) : <div className="muted">No students enrolled</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Profile;