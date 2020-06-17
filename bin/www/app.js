const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 4000;

const users = require('./utils/users');


io.of('/').on('connection', socket => {

    socket.on('join', data => {

        users.insertUser(socket.id, data.user, data.room);
        const user = users.currentUser(socket.id)
        console.log(user)
        socket.join(data.room)
        socket.broadcast.to(user.room).emit('joined', { user: user.user, message: 'joined the room' })

        io.to(data.room).emit('usersInRoom', users.usersInRoom(data.room))
    })


    socket.on('message', data => {
        let user = users.currentUser(socket.id);

        if (user) {
            console.log(data)
            io.to(user.room).emit('message', { user: user.user, message: data });
        }

    })


    socket.on('leave', data => {
        console.log(socket.id)
        const user = users.userLeave(socket.id)
        console.log(user)
        if (user) {
            socket.leave(user.room);
            socket.broadcast.to(user.room).emit('left room', { user: user.user, message: 'left the room' })

            io.to(user.room).emit('usersInRoom', users.usersInRoom(user.room))
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
