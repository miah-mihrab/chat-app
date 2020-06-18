const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  users: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    }
  }],
  messages: [{}]

});


const room = mongoose.model('room', RoomSchema);

module.exports = room;
