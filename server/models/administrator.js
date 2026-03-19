const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passhash: { type: String, required: true },
  // optional fields that may appear in the DB (email, name, hint, etc.)
  email: { type: String, trim: true, lowercase: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  hint: { type: String }
}, { strict: false });

adminSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('Administrator', adminSchema);
