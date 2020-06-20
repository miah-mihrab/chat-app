require('../www/database/db')
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 4000;
const users = require('./utils/users');
const Users = require('../www/models/users');
const Rooms = require('../www/models/rooms');

let allMessage = [];


// @JoinRoom
async function joinRoom(socket, socketId, data, userId) {
  users.insertUser(socketId, data.user, data.room, userId);
  const current_user = users.currentUser(userId);

  // @GetRoom from database
  const room = await Rooms.findOne({ 'users.user': userId });
  allMessage = room.messages;

  socket.join(data.room)
  socket.broadcast.to(current_user.room).emit('joined', { user: current_user.user, message: 'joined the room', userId: current_user.userId })
  io.to(data.room).emit('usersInRoom', { online: users.usersInRoom(data.room), messages: room.messages })
}


io.of('/').on('connection', socket => {

  // @NewJoinToRoom
  socket.on('join', async data => {

    // @FindUser with name in db
    const user = await Users.findOne({ name: data.user });

    let room;
    let newRoom;


    if (!user) {
      // @If no user exist create one
      const newUser = new Users({ name: data.user });
      await newUser.save();

      // @FindRoom with room name;
      const room = await Rooms.findOne({ name: data.room });
      if (!room) {

        // @If no room exist create new room
        const newRoom = new Rooms({ name: data.room, users: [{ user: newUser._id }] });
        await newRoom.save();
        joinRoom(socket, socket.id, data, newUser._id)

      } else {
        // @If room exist & not in user's rooms array include it
        if (!room.users.includes()) {
          room.users.push({ user: newUser._id });;
          await room.save();
        }

        joinRoom(socket, socket.id, data, newUser._id);
      }
    } else {

      // @If user exist find room
      room = await Rooms.findOne({ name: data.room });
      if (room) {
        // @If room exist, then check if user exist in room
        let found = false;
        for (let i = 0; i < room.users.length; i++) {

          if (room.users[i] === user._id) {
            found = true;
            break;
          }
        }
        if (!found) {
          // @If user not exist push it into room
          room.users.push({ user: user._id });;
          await room.save();
        }
        joinRoom(socket, socket.id, data, user._id)

      } else {
        // @If user exist but no room; Create new room and add the user;
        newRoom = new Rooms({ name: data.room, users: [{ id: newUser._id }] });
        await newRoom.save();
        joinRoom(socket, socket.id, data, user._id)

      }
    }

  })


  // @SendMessage to group
  socket.on('message', async data => {

    // @Find user with socket id in users array
    let user = users.currentUserWithSocketId(socket.id);

    // @FindRoom and push message to message array of the room
    const room = await Rooms.findOne({ 'users.user': user.userId });
    let time = Date.now();
    await room.messages.push({
      user: user.user,
      message: data.message,
      message_time: time
    })
    await room.save();

    if (user) {
      // @Emit the message to the specific room
      io.to(data.room).emit('message', { user: user.user, message: data.message, message_time: time, new_message: true });
    }

  })


  // @MakePrivateRoom for user to user;
  socket.on('makePrivateRoom', async data => {
    // @Get Current user and target user;
    let current_user = users.currentUserWithSocketId(socket.id);
    let targetUser = users.currentUser(data.targetId);

    let roomName = `${current_user.userId}+${data.targetId}`;

    // @Check if room exists for two users
    let findRoom = await Rooms.findOne({ name: roomName }) || await Rooms.findOne({ name: roomName.split('').reverse().join('') });

    if (!findRoom) {
      // @If no room then make one room for two specific user with their ids
      let newRoom = new Rooms({
        name: roomName,
        users: [{ user: current_user.userId }, { user: targetUser.userId }]
      })
      await newRoom.save();
    }
    // @Get Messages if room exist
    let messages = (findRoom && findRoom._id) ? findRoom.messages : []

    // @Join the current user;
    socket.join(roomName);
    // @Send notification as room joined by the host user;
    io.to(socket.id).emit('createdPrivateRoom', { room: roomName, messages, targetUser: targetUser.user });

    // @Send notification to targetUser for joining the room
    for (let i = 0; i < targetUser.sockets.length; i++) {
      io.to(targetUser.sockets[i]).emit('requestToJoinPrivateRoom', { room: roomName, targetUser: current_user.user })
    }

  })

  // @CYCLE while creating private room
  // currentUser->CreateRoom->Send Notification to Target user -> Target user receive notifcation
  // -> TU send request to server for joining the room -> Server detects the socket id for request and join the target user


  // @TargetUser will join room here
  socket.on('joinPrivateRoom', async data => {
    let room = await Rooms.findOne({ name: data.room }) || await Rooms.findOne({ name: data.room.split('').reverse().join('') });
    let messages = room.messages;
    console.log("JOIN PRIVATE ROOM", data.room);
    socket.join(data.room);
    socket.emit('joinedPrivateRoom', { room: data.room, messages, targetUser: data.targetUser })
  })

  // @PrivateMessage transmission
  socket.on('privateMessage', async data => {
    let room = await Rooms.findOne({ name: data.room });
    let time = Date.now();
    room.messages.push({ user: users.currentUserWithSocketId(socket.id).user, message_time: time, message: data.message });
    await room.save();
    io.to(data.room).emit('privateMessage',
      {
        message: { user: users.currentUserWithSocketId(socket.id).user, message: data.message, message_time: time },
        room: data.room,
        new_message: true
      })
  })


  socket.on('leave', data => {
    const user = users.userLeave(socket.id)
    if (user) {
      console.log("USER LEFT")
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
