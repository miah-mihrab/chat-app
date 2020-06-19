require('../www/database/db')
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 4000;

const users = require('./utils/users');

const Users = require('../www/models/users');
const Rooms = require('../www/models/rooms');
const user = require('../www/models/users');
let allMessage = [];

async function joinRoom(socket, socketId, data, userId) {

  users.insertUser(socketId, data.user, data.room, userId);
  const current_user = users.currentUser(userId)
  socket.join(data.room)
  const room = await Rooms.findOne({ 'users.user': userId });
  allMessage = room.messages;
  socket.broadcast.to(current_user.room).emit('joined', { user: current_user.user, message: 'joined the room', userId: current_user.userId })

  io.to(data.room).emit('usersInRoom', { online: users.usersInRoom(data.room), messages: room.messages })
}


io.of('/').on('connection', socket => {

  socket.on('join', async data => {

    //FIND USER
    const user = await Users.findOne({ name: data.user });
    let room;
    let newRoom;
    if (!user) {
      const newUser = new Users({ name: data.user });
      await newUser.save();
      const room = await Rooms.findOne({ name: data.room });
      if (!room) {
        const newRoom = new Rooms({ name: data.room, users: [{ user: newUser._id }] });
        await newRoom.save();
        joinRoom(socket, socket.id, data, newUser._id)

      } else {
        if (!room.users.includes()) {
          room.users.push({ user: newUser._id });;
          await room.save();
        }
        joinRoom(socket, socket.id, data, newUser._id)

      }
    } else {
      room = await Rooms.findOne({ name: data.room });
      if (room) {
        let found = false;
        for (let i = 0; i < room.users.length; i++) {
          found = true;
          break;
        }
        if (!found) {
          room.users.push({ user: user._id });;
          await room.save();
        }
        joinRoom(socket, socket.id, data, user._id)

      } else {
        newRoom = new Rooms({ name: data.room, users: [{ id: newUser._id }] });
        await newRoom.save();
        joinRoom(socket, socket.id, data, user._id)

      }
    }


  })


  socket.on('message', async data => {
    let user = users.currentUserWithSocketId(socket.id);
    console.log(user);
    const room = await Rooms.findOne({ 'users.user': user.userId });
    console.log(room)
    await room.messages.push({
      user: user.user,
      message: data
    })
    await room.save();

    if (data.room) {
      io.to(data.room).emit('privateMessage', { user: users.currentUserWithSocketId(socket.id).user, message: data.message })
    }
    else if (user) {
      io.to(user.room).emit('message', { user: user.user, message: data });
    }

  })


  socket.on('makePrivateRoom', async data => {
    let current_user = users.currentUserWithSocketId(socket.id);
    let targetUser = users.currentUser(data.targetId);

    let roomName = `${current_user.userId}+${data.targetId}`;


    let findRoom = await Rooms.findOne({ name: roomName }) || await Rooms.findOne({ name: roomName.split('').reverse().join('') });
    console.log(findRoom, "FIND")
    if (!findRoom) {
      let newRoom = new Rooms({
        name: roomName,
        users: [{ user: current_user.userId }, { user: targetUser.userId }]
      })
      await newRoom.save();
    }
    let messages = (findRoom && findRoom._id) ? findRoom.messages : []
    socket.join(roomName);
    io.to(socket.id).emit('createdPrivateRoom', { room: roomName, messages });
    io.to(targetUser.id).emit('requestToJoinPrivateRoom', { room: roomName })
  })


  socket.on('joinPrivateRoom', async data => {
    let room = await Rooms.findOne({ name: data.room }) || await Rooms.findOne({ name: data.room.split('').reverse().join('') });
    let messages = room.messages;
    socket.join(data.room);
    socket.emit('joinedPrivateRoom', { room: data.room, messages })
    // socket.emit('joinedPrivateRoom', { room: data.room })
  })

  socket.on('privateMessage', async data => {
    let room = await Rooms.findOne({ name: data.room });
    room.messages.push({ user: users.currentUserWithSocketId(socket.id).user, message: data.message });
    await room.save();
    io.to(data.room).emit('privateMessage',
      {
        message: { user: users.currentUserWithSocketId(socket.id).user, message: data.message },
        room: data.room
      })
  })


  socket.on('leave', data => {
    const user = users.userLeave(socket.id)
    console.log(user)
    if (user) {
      socket.leave(user.room);
      socket.broadcast.to(user.room).emit('left room', { user: user.user, message: 'left the room' })

      io.to(user.room).emit('usersInRoom', { online: users.usersInRoom(user.room), messages: allMessage })
    }
  })
  io.on('disconnect', socket => {
    const user = user.userLeave(socket.id)
    io.to(user.room).emit('usersInRoom', users.usersInRoom(user.room))
    console.log('A user disconnected');
  })
})
http.listen(PORT, console.log(`Server Up and Running`));


// DB STRUCTURE

// users
//     |
//     |______id
//     |______name
// rooms
//     |
//     |______id
//     |______name(userOne+userTwo)
//     |______users[]
//     |______messages[]
