// Usage: node server/scripts/migrate_class_students.js
// This will convert Class.students entries from ObjectId to the corresponding student.username
// Run once and verify your DB before and after.

import mongoose from 'mongoose';
import Student from '../models/student.js';
import Class from '../models/class.js';

// Replace with your DB URI or export MONGODB_URI env var
const uri = process.env.MONGODB_URI || "mongodb+srv://David:FlightWolf@sr-application.otbn587.mongodb.net/";

async function migrate() {
  await mongoose.connect(uri);
  const classes = await Class.find({});
  console.log('Found', classes.length, 'classes');
  for (const cls of classes) {
    if (!cls.students || !cls.students.length) continue;
    // if first element looks like an ObjectId, convert
    const first = cls.students[0];
    // crude check: ObjectId usually has 24 hex chars
    const looksLikeObjectId = typeof first === 'object' || (typeof first === 'string' && first.length === 24);
    if (!looksLikeObjectId) {
      console.log('Class', cls._id, 'already uses usernames, skipping');
      continue;
    }

    const newStudents = [];
    for (const sid of cls.students) {
      try {
        const s = await Student.findById(sid).select('username');
        if (s && s.username) newStudents.push(s.username);
        else console.warn('No student found for id', sid, 'in class', cls._id);
      } catch (e) {
        console.error('Error looking up student', sid, e);
      }
    }

    cls.students = newStudents;
    await cls.save();
    console.log('Migrated class', cls._id, '->', newStudents.length, 'usernames');
  }
  console.log('Migration complete');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
