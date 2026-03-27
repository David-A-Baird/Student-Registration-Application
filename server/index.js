import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();
// Make this an environment variable for production
const uri = process.env.MONGO_URI.toString();
const app = express();
import cors from 'cors';

app.use(cors())
app.use(express.urlencoded({ extended: true })); 
// accept JSON bodies for login and other API routes
app.use(express.json());

import student from './models/student.js';
import Class from './models/class.js';
import Administrator from './models/administrator.js';
import logger from './logger.js';

logger.info('Info Message');
logger.error('Error Message');
logger.warn('Warning Message');

// helper to populate student documents for a class when Class.students stores usernames
async function populateStudentsForClass(cls) {
  if (!cls) return cls;
  const obj = cls.toObject ? cls.toObject() : cls;
  if (!obj.students || !obj.students.length) {
    obj.students = [];
    return obj;
  }
  const studs = await student.find({ username: { $in: obj.students } }).select('-passHash');
  obj.students = studs;
  return obj;
}

async function populateStudentsForClasses(classes) {
  return await Promise.all((classes || []).map(populateStudentsForClass));
}

// Helpers to check schedule overlap and code conflicts for classes with the same name
function parseTimeToMinutes(t) {
  if (!t || typeof t !== 'string') return null;
  const parts = t.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function intervalsOverlap(startA, endA, startB, endB) {
  if (startA == null || endA == null || startB == null || endB == null) return true; // treat unknown times as overlapping
  return startA < endB && startB < endA;
}

function daysOverlap(daysA, daysB) {
  if (!Array.isArray(daysA) || !Array.isArray(daysB) || daysA.length === 0 || daysB.length === 0) return true; // unknown days -> treat as overlapping
  const setA = new Set(daysA.map(String));
  return daysB.some((d) => setA.has(String(d)));
}

async function checkClassCreateConflicts({ name, code, startTime, endTime, days }, excludeId = null) {
  // find existing classes with same name
  const existing = await Class.find({ name });
  const newCode = String(code || '').trim();
  const newStart = parseTimeToMinutes(startTime);
  const newEnd = parseTimeToMinutes(endTime);
  for (const ex of existing) {
    if (excludeId && String(ex._id) === String(excludeId)) continue;
    const exCode = String(ex.code || '').trim();
    // same code + same name is not allowed
    if (exCode === newCode && newCode !== '') {
      return { conflict: true, message: 'A class with the same name and code already exists' };
    }
    // if codes differ, ensure times/days do not overlap
    if (exCode !== newCode) {
      const exStart = parseTimeToMinutes(ex.startTime);
      const exEnd = parseTimeToMinutes(ex.endTime);
      if (daysOverlap(ex.days, days) && intervalsOverlap(exStart, exEnd, newStart, newEnd)) {
        return { conflict: true, message: 'A class with the same name has an overlapping schedule' };
      }
    }
  }
  return { conflict: false };
}

mongoose.connect(uri);
const db = mongoose.connection;
db.on('error', (err) => {
    console.log('DB connection error:', err);
});
db.once('open', () => {
    console.log('DB connected successfully');
});

// Public class search endpoint for students
app.post('/classSearch', async (req, res) => {
  try {
    const q = req.body.class || req.body.query;
    if (!q || String(q).trim() === '') return res.status(400).json({ error: 'query required' });
    const regex = new RegExp(String(q).trim(), 'i');
  const results = await Class.find({ $or: [{ name: regex }, { code: regex }, { description: regex }] });
  const populated = await populateStudentsForClasses(results);
  res.json({ results: populated });
  } catch (err) {
    console.error('public class search error', err);
    res.status(500).json({ error: 'search failed' });
  }
});

app.get('/SignUp', async (req, res) => {
    const { username, firstName, lastName, email, address, phoneNumber, password } = req.query;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email and password are required' });
    }

    try {
      // check for existing user by username or email
      const existing = await student.findOne({ $or: [{ username }, { email: String(email).toLowerCase() }] });
      if (existing) {
        if (existing.username === username) return res.status(409).json({ error: 'Username already exists' });
        if (existing.email === String(email).toLowerCase()) return res.status(409).json({ error: 'Email already registered' });
      }

      const passHash = await bcrypt.hash(password, parseInt(process.env.SALT));
      const newStudent = new student({ username, firstName, lastName, email: String(email).toLowerCase(), address, phoneNumber, passHash });
      const savedStudent = await newStudent.save();
      res.status(201).json(savedStudent);
    } catch (err) {
        // handle duplicate key from unique index as a safety net
        if (err && err.code === 11000) {
          const dupKey = Object.keys(err.keyValue || {})[0];
          return res.status(409).json({ error: `${dupKey} already exists` });
        }
        console.error('SignUp error:', err);
        res.status(500).json({ error: 'Failed to add student' });
    }
});

// Login endpoint (POST). Accepts JSON { username, password } and returns student data on success.
app.post('/LogIn', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    // First check administrators collection
    const admin = await Administrator.findOne({ username });
    if (admin) {
      // be tolerant of different field names or formats in the DB
      const stored = admin.passhash || admin.passwordHash || admin.password || admin.pass;
      if (!stored) {
        console.warn('Administrator found but no password field present for user', username);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      let matchAdmin = false;
      try {
        const s = String(stored);
        matchAdmin = await bcrypt.compare(password, s);
      } catch (e) {
        console.error('Error comparing administrator password for', username, e);
        return res.status(500).json({ error: 'Login failed' });
      }

      if (matchAdmin) {
        const user = admin.toObject();
        // remove any sensitive fields
        delete user.passHash;
        delete user.passwordHash;
        delete user.password;
        delete user.pass;
        // mark as admin for client
        user.isAdmin = true;
        // include a redirect hint for the client to navigate to admin console
        return res.status(200).json({ user, redirect: '/admin' });
      }

      // admin found but password mismatch
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // find the student by username
    const found = await student.findOne({ username });
    if (!found) return res.status(401).json({ error: 'Invalid username or password' });

    const match = await bcrypt.compare(password, found.passHash);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });

  // return user data without sensitive fields
  const user = found.toObject();
  delete user.passHash;

  // include default redirect for regular users
  return res.status(200).json({ user, redirect: '/Profile' });
  } catch (err) {
    console.error('LogIn error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Admin middleware removed: admin routes are now open (no admin-key required)

// Admin routes: search students
app.post('/admin/students/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || String(query).trim() === '') return res.status(400).json({ error: 'query required' });
    const q = String(query).trim();
    const regex = new RegExp(q, 'i');
    const results = await student.find({ $or: [{ username: regex }, { email: regex }, { firstName: regex }, { lastName: regex }] }).select('-passHash');
    res.json({ results });
  } catch (err) {
    console.error('admin student search error', err);
    res.status(500).json({ error: 'search failed' });
  }
});

// Admin routes: search classes
app.post('/admin/classes/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || String(query).trim() === '') return res.status(400).json({ error: 'query required' });
    const q = String(query).trim();
    const regex = new RegExp(q, 'i');
  const results = await Class.find({ $or: [{ name: regex }, { code: regex }, { description: regex }] });
  const populated = await populateStudentsForClasses(results);
  res.json({ results: populated });
  } catch (err) {
    console.error('admin class search error', err);
    res.status(500).json({ error: 'search failed' });
  }
});

// Create a class
app.post('/admin/classes', async (req, res) => {
  try {
    const { name, code, description, room, startTime, endTime, days } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    // ensure new class doesn't conflict with existing classes of the same name
    const conflict = await checkClassCreateConflicts({ name, code, startTime, endTime, days });
    if (conflict.conflict) return res.status(409).json({ error: conflict.message });

    const newClass = new Class({ name, code, description, room, startTime, endTime, days });
    const saved = await newClass.save();
    const populated = await populateStudentsForClass(saved);
    res.status(201).json({ class: populated });
  } catch (err) {
    console.error('create class error', err);
    if (err && err.code === 11000) return res.status(409).json({ error: 'Duplicate key' });
    res.status(500).json({ error: 'failed to create class' });
  }
});

// Add student to class
app.put('/admin/classes/:id/add-student', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    const cls = await Class.findById(id);
    const student = await student.findById(studentId);
  if (!cls || !student) return res.status(404).json({ error: 'class or student not found' });
  // store username in class.students
  if (!cls.students.map(String).includes(String(student.username))) cls.students.push(student.username);
  if (!student.classes.map(String).includes(String(cls._id))) student.classes.push(cls._id);
  await cls.save();
  await student.save();
  const updated = await Class.findById(id);
  res.json({ class: await populateStudentsForClass(updated) });
  } catch (err) {
    console.error('add student to class error', err);
    res.status(500).json({ error: 'failed to add student to class' });
  }
});

// Remove student from class
app.put('/admin/classes/:id/remove-student', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    const cls = await Class.findById(id);
    const stud = await student.findById(studentId);
  if (!cls || !stud) return res.status(404).json({ error: 'class or student not found' });
  // remove by username
  cls.students = cls.students.filter((s) => String(s) !== String(stud.username));
  stud.classes = stud.classes.filter((c) => String(c) !== String(cls._id));
  await cls.save();
  await stud.save();
  const updated = await Class.findById(id);
  res.json({ class: await populateStudentsForClass(updated) });
  } catch (err) {
    console.error('remove student from class error', err);
    res.status(500).json({ error: 'failed to remove student from class' });
  }
});

// Public endpoints for students to enroll/unenroll themselves in a class
app.put('/classes/:id/enroll', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    const cls = await Class.findById(id);
    const stud = await student.findById(studentId);
    if (!cls || !stud) return res.status(404).json({ error: 'class or student not found' });
  // store username in class.students and avoid duplicates
  if (!cls.students.map(String).includes(String(stud.username))) cls.students.push(stud.username);
  if (!stud.classes.map(String).includes(String(cls._id))) stud.classes.push(cls._id);
  await cls.save();
  await stud.save();
  const updated = await Class.findById(id);
  res.json({ class: await populateStudentsForClass(updated) });
  } catch (err) {
    console.error('enroll error', err);
    res.status(500).json({ error: 'failed to enroll' });
  }
});

app.put('/classes/:id/unenroll', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    const cls = await Class.findById(id);
    const stud = await student.findById(studentId);
    if (!cls || !stud) return res.status(404).json({ error: 'class or student not found' });
  cls.students = cls.students.filter((s) => String(s) !== String(stud.username));
  stud.classes = stud.classes.filter((c) => String(c) !== String(cls._id));
  await cls.save();
  await stud.save();
  const updated = await Class.findById(id);
  res.json({ class: await populateStudentsForClass(updated) });
  } catch (err) {
    console.error('unenroll error', err);
    res.status(500).json({ error: 'failed to unenroll' });
  }
});

// Edit class (update scheduling, room, etc.)
app.put('/admin/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    const allowed = ['name', 'code', 'description', 'room', 'startTime', 'endTime', 'days'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    // Ensure days are an array of valid day strings if provided
    if (updates.days && !Array.isArray(updates.days)) {
      return res.status(400).json({ error: 'days must be an array' });
    }
    // Fetch existing class to compute full new state for conflict checking
    const existing = await Class.findById(id);
    if (!existing) return res.status(404).json({ error: 'class not found' });
    const merged = {
      name: updates.name !== undefined ? updates.name : existing.name,
      code: updates.code !== undefined ? updates.code : existing.code,
      startTime: updates.startTime !== undefined ? updates.startTime : existing.startTime,
      endTime: updates.endTime !== undefined ? updates.endTime : existing.endTime,
      days: updates.days !== undefined ? updates.days : existing.days
    };
    const conflict = await checkClassCreateConflicts(merged, id);
    if (conflict.conflict) return res.status(409).json({ error: conflict.message });

    const updatedDoc = await Class.findByIdAndUpdate(id, updates, { new: true });
    const updated = await populateStudentsForClass(updatedDoc);
    res.json({ class: updated });
  } catch (err) {
    console.error('edit class error', err);
    if (err && err.code === 11000) return res.status(409).json({ error: 'Duplicate class name' });
    res.status(500).json({ error: 'failed to update class' });
  }
});

// Delete class
app.delete('/admin/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ error: 'class not found' });
    // remove class reference from students
    await student.updateMany({ classes: cls._id }, { $pull: { classes: cls._id } });
    await cls.remove();
    res.json({ success: true });
  } catch (err) {
    console.error('delete class error', err);
    res.status(500).json({ error: 'failed to delete class' });
  }
});

// Edit student data
app.put('/admin/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    // don't allow passHash direct write; accept a 'password' field to re-hash
    if (updates.password) {
      updates.passHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }
    // normalize email
    if (updates.email) updates.email = String(updates.email).toLowerCase();
    const updated = await student.findByIdAndUpdate(id, updates, { new: true }).select('-passHash');
    if (!updated) return res.status(404).json({ error: 'student not found' });
    res.json({ student: updated });
  } catch (err) {
    console.error('edit student error', err);
    res.status(500).json({ error: 'failed to update student' });
  }
});

// Student self-edit endpoint (allows a student to update their own profile)
app.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    // don't allow passHash direct write; accept a 'password' field to re-hash
    if (updates.password) {
      updates.passHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }
    // normalize email
    if (updates.email) updates.email = String(updates.email).toLowerCase();
    const updated = await student.findByIdAndUpdate(id, updates, { new: true }).select('-passHash');
    if (!updated) return res.status(404).json({ error: 'student not found' });
    res.json({ student: updated });
  } catch (err) {
    console.error('student self-edit error', err);
    res.status(500).json({ error: 'failed to update student' });
  }
});

// Delete student

app.delete('/admin/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stud = await student.findById(id);
    if (!stud) return res.status(404).json({ error: 'student not found' });
    // remove student from any classes (students stored by username)
    await Class.updateMany({ students: stud.username }, { $pull: { students: stud.username } });
    await student.deleteOne({ _id: stud._id });
    res.json({ success: true });
  } catch (err) {
    console.error('delete student error', err);
    res.status(500).json({ error: 'failed to delete student' });
  }
});

app.listen(8080, () => {
      console.log('server listening on port 8080')
})