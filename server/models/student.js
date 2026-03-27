import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true, trim: true },
	firstName: { type: String, required: true, trim: true },
	lastName: { type: String, required: true, trim: true },
	email: { type: String, required: true, unique: true, trim: true, lowercase: true },
	address: { type: String, trim: true },
	phoneNumber: { type: String, trim: true },
	passHash: { type: String, required: true },
  // role and relational fields
  isAdmin: { type: Boolean, default: false },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }]
});

// Create indexes for unique fields
studentSchema.index({ username: 1 }, { unique: true });
studentSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('student', studentSchema);