const express = require('express');
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
// Make this an environment variable for production
const uri = "mongodb+srv://David:FlightWolf@sr-application.otbn587.mongodb.net/"
const app = express();
const cors = require('cors');

app.use(cors())
app.use(express.urlencoded({ extended: true })); 

const student = require('./models/student');

mongoose.connect(uri);
const db = mongoose.connection;
db.on('error', (err) => {
    console.log('DB connection error:', err);
});
db.once('open', () => {
    console.log('DB connected successfully');
});

app.get('/SignUp', async (req, res) => {
    const { username, firstName, lastName, email, address, phoneNumber, password } = req.query;
    try {
      const passHash = await bcrypt.hash(password, 10)
      const newStudent = new student({username, firstName, lastName, email, address, phoneNumber, passHash});
      const savedStudent = await newStudent.save();
      res.status(201).json(savedStudent);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add student'})
    }
});

app.get('/LogIn', async (req, res) => {
  const role = req.body;
  if(role = student) {
    try {
      const { username, password } = req.query;
      const student = await student.find({username: username});
      const passmatch = bcrypt.compare(password, student.passHash);
      if(passmatch) {
        res.redirect(`/Profile`);
      } else {
        res.status(401).send('Wrong Password or Username');
      }
    } catch(error) {
      res.status(500).send(error.message);
    }
  } else {
    try {
      const { username, password } = req.body;
      const administrator = await administrator.find({username: username});
      const passmatch = bcrypt.compare(password, administrator.passhash);
      if(passmatch) {
        req.redirect('/adminpage')
      } else {
        res.status(401).send('Wrong Password or Username')
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
});

app.listen(8080, () => {
      console.log('server listening on port 8080')
})