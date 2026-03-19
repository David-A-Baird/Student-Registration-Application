const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  code: { type: String, trim: true },
  description: { type: String, trim: true },
  room: { type: String, trim: true },
  // ISO time strings or HH:MM
  startTime: { type: String, trim: true },
  endTime: { type: String, trim: true },
  // days of week, e.g. ['Mon','Wed','Fri']
  days: [{ type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] }],
  // store enrolled students by username (string) rather than ObjectId
  students: [{ type: String, trim: true }]
});

classSchema.index({ name: 1 }, { unique: true });
classSchema.index({ code: 1 });

module.exports = mongoose.model('Class', classSchema);
