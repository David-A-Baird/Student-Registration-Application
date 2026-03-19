import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const navigate = useNavigate();
  const raw = localStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;
  const [studentQuery, setStudentQuery] = useState('');
  const [classQuery, setClassQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassData, setEditClassData] = useState<any>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [newClassRoom, setNewClassRoom] = useState('');
  const [newClassStartTime, setNewClassStartTime] = useState('');
  const [newClassEndTime, setNewClassEndTime] = useState('');
  const [newClassDays, setNewClassDays] = useState<string[]>([]);

  // Require login and admin role
  if (!user) {
    navigate('/login');
    return null;
  }
  if (!user.isAdmin) {
    return (<div><h3>Access denied</h3><p>You must be an admin to access this page.</p></div>);
  }

  // adminKey removed — admin routes are currently unprotected

  const searchStudents = async () => {
    try {
  const res = await axios.post('http://localhost:8080/admin/students/search', { query: studentQuery });
      setStudents(res.data.results || []);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Search failed');
    }
  };

  const searchClasses = async () => {
    try {
  const res = await axios.post('http://localhost:8080/admin/classes/search', { query: classQuery });
      setClasses(res.data.results || []);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Search failed');
    }
  };

  const createClass = async () => {
    try {
      const payload = {
        name: newClassName,
        code: newClassCode,
        description: newClassDescription,
        room: newClassRoom,
        startTime: newClassStartTime,
        endTime: newClassEndTime,
        days: newClassDays
      };
  await axios.post('http://localhost:8080/admin/classes', payload);
      alert('Class created');
      setNewClassName(''); setNewClassCode(''); setNewClassDescription(''); setNewClassRoom(''); setNewClassStartTime(''); setNewClassEndTime(''); setNewClassDays([]);
      searchClasses();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Create failed');
    }
  };

  const startEditClass = (c: any) => {
    setEditingClassId(c._id);
    setEditClassData({
      name: c.name,
      code: c.code || '',
      description: c.description || '',
      room: c.room || '',
      startTime: c.startTime || '',
      endTime: c.endTime || '',
      days: c.days || []
    });
  };

  const saveClassEdit = async (id: string) => {
    try {
  await axios.put(`http://localhost:8080/admin/classes/${id}`, editClassData);
      alert('Class saved');
      setEditingClassId(null);
      searchClasses();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Save failed');
    }
  };

  const deleteClass = async (id: string) => {
    if (!confirm('Delete this class?')) return;
    try {
  await axios.delete(`http://localhost:8080/admin/classes/${id}`);
      alert('Class deleted');
      searchClasses();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Delete failed');
    }
  };

  const startEdit = (s: any) => {
    setEditing(s._id);
    setEditData({ username: s.username, firstName: s.firstName, lastName: s.lastName, email: s.email, address: s.address, phoneNumber: s.phoneNumber, isAdmin: s.isAdmin || false });
  };

  const saveEdit = async (id: string) => {
    try {
  await axios.put(`http://localhost:8080/admin/students/${id}`, editData);
      alert('Saved');
      setEditing(null);
      searchStudents();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Save failed');
    }
  };

  const deleteStudent = async (id: string) => {
    if (!confirm('Delete this student?')) return;
    try {
  await axios.delete(`http://localhost:8080/admin/students/${id}`);
      alert('Deleted');
      searchStudents();
      searchClasses();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Delete failed');
    }
  };

  const addStudentToClass = async (classId: string, studentId: string) => {
    try {
  await axios.put(`http://localhost:8080/admin/classes/${classId}/add-student`, { studentId });
      alert('Added to class');
      searchClasses();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Add failed');
    }
  };

  const removeStudentFromClass = async (classId: string, studentId: string) => {
    try {
  await axios.put(`http://localhost:8080/admin/classes/${classId}/remove-student`, { studentId });
      alert('Removed from class');
      searchClasses();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Remove failed');
    }
  };

  return (
    <div>
      <h2>Admin Console</h2>
      {/* Admin key input removed — admin routes are unprotected for now */}

      <section style={{ marginTop: 20 }}>
        <h3>Search Students</h3>
        <input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} />
        <button onClick={searchStudents}>Search</button>
        <div>
          {students.map((s) => (
            <div key={s._id} style={{ border: '1px solid #ccc', padding: 8, margin: 8 }}>
              {editing === s._id ? (
                <div>
                  <input value={editData.username} onChange={(e) => setEditData({ ...editData, username: e.target.value })} />
                  <input value={editData.firstName} onChange={(e) => setEditData({ ...editData, firstName: e.target.value })} />
                  <input value={editData.lastName} onChange={(e) => setEditData({ ...editData, lastName: e.target.value })} />
                  <input value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                  <input value={editData.address || ''} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
                  <input value={editData.phoneNumber || ''} onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })} />
                  <label>
                    Admin:
                    <input type="checkbox" checked={!!editData.isAdmin} onChange={(e) => setEditData({ ...editData, isAdmin: e.target.checked })} />
                  </label>
                  <button onClick={() => saveEdit(s._id)}>Save</button>
                  <button onClick={() => setEditing(null)}>Cancel</button>
                </div>
              ) : (
                <div>
                  <p><strong>{s.username}</strong> ({s.email})</p>
                  <p>{s.firstName} {s.lastName}</p>
                  <p>{s.address} {s.phoneNumber}</p>
                  <p>Admin: {s.isAdmin ? 'Yes' : 'No'}</p>
                  <button onClick={() => startEdit(s)}>Edit</button>
                  <button onClick={() => deleteStudent(s._id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Classes</h3>
        <input value={classQuery} onChange={(e) => setClassQuery(e.target.value)} />
        <button onClick={searchClasses}>Search Classes</button>
        <div>
          <div style={{ marginBottom: 8 }}>
            <input placeholder="New class name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input placeholder="Code" value={newClassCode} onChange={(e) => setNewClassCode(e.target.value)} />
            <input placeholder="Room" value={newClassRoom} onChange={(e) => setNewClassRoom(e.target.value)} style={{ marginLeft: 8 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input placeholder="Description" value={newClassDescription} onChange={(e) => setNewClassDescription(e.target.value)} style={{ width: '60%' }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Start: </label>
            <input type="time" value={newClassStartTime} onChange={(e) => setNewClassStartTime(e.target.value)} />
            <label style={{ marginLeft: 8 }}>End: </label>
            <input type="time" value={newClassEndTime} onChange={(e) => setNewClassEndTime(e.target.value)} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Days: </label>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
              <label key={d} style={{ marginRight: 8 }}>
                <input type="checkbox" checked={newClassDays.includes(d)} onChange={(e) => {
                  const setDays = new Set(newClassDays);
                  if (e.target.checked) setDays.add(d); else setDays.delete(d);
                  setNewClassDays(Array.from(setDays));
                }} /> {d}
              </label>
            ))}
          </div>
          <div>
            <button onClick={createClass}>Create Class</button>
          </div>
        </div>
        <div>
          {classes.map((c) => (
            <div key={c._id} style={{ border: '1px solid #ccc', padding: 8, margin: 8 }}>
              {editingClassId === c._id ? (
                <div>
                  <div>
                    <label>Name: </label>
                    <input value={editClassData.name} onChange={(e) => setEditClassData({ ...editClassData, name: e.target.value })} />
                  </div>
                  <div>
                    <label>Code: </label>
                    <input value={editClassData.code} onChange={(e) => setEditClassData({ ...editClassData, code: e.target.value })} />
                  </div>
                  <div>
                    <label>Description: </label>
                    <input value={editClassData.description} onChange={(e) => setEditClassData({ ...editClassData, description: e.target.value })} />
                  </div>
                  <div>
                    <label>Room: </label>
                    <input value={editClassData.room} onChange={(e) => setEditClassData({ ...editClassData, room: e.target.value })} />
                  </div>
                  <div>
                    <label>Start: </label>
                    <input type="time" value={editClassData.startTime} onChange={(e) => setEditClassData({ ...editClassData, startTime: e.target.value })} />
                    <label>End: </label>
                    <input type="time" value={editClassData.endTime} onChange={(e) => setEditClassData({ ...editClassData, endTime: e.target.value })} />
                  </div>
                  <div>
                    <label>Days: </label>
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
                      <label key={d} style={{ marginRight: 8 }}>
                        <input type="checkbox" checked={(editClassData.days || []).includes(d)} onChange={(e) => {
                          const days = new Set(editClassData.days || []);
                          if (e.target.checked) days.add(d); else days.delete(d);
                          setEditClassData({ ...editClassData, days: Array.from(days) });
                        }} /> {d}
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => saveClassEdit(c._id)}>Save</button>
                    <button onClick={() => setEditingClassId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <h4>{c.name} {c.code ? `(${c.code})` : ''}</h4>
                  <p>{c.description}</p>
                  <p>Room: {c.room || '—'}</p>
                  <p>Time: {c.startTime || '—'} — {c.endTime || '—'}</p>
                  <p>Days: {(c.days && c.days.length) ? c.days.join(', ') : '—'}</p>
                  <div>
                    <h5>Students</h5>
                    {c.students && c.students.length ? c.students.map((s: any) => (
                      <div key={s._id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div>{s.username} ({s.email})</div>
                        <button onClick={() => removeStudentFromClass(c._id, s._id)}>Remove</button>
                      </div>
                    )) : <div>No students</div>}
                    <div style={{ marginTop: 8 }}>
                      <label>Add student by id: </label>
                      <input id={`add-${c._id}`} placeholder="student id" />
                      <button onClick={() => {
                        // read input value
                        // @ts-ignore
                        const val = (document.getElementById(`add-${c._id}`) as HTMLInputElement).value;
                        if (val) addStudentToClass(c._id, val);
                      }}>Add</button>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => startEditClass(c)}>Edit Class</button>
                      <button onClick={() => deleteClass(c._id)}>Delete Class</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Admin;
