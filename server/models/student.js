const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({username: String, firstName: String, lastName: String, email: String, address: String, phoneNumber: String, passHash: String});
module.exports = mongoose.model('student', studentSchema);