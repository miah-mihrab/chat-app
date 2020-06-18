const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  }
});

const user = mongoose.model('user', UserSchema);


module.exports = user;
