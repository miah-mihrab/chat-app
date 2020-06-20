let users = [];

exports.insertUser = (id, user, room, userId) => {
  let found = false;
  for (let i = 0; i < users.length; i++) {

    console.log(users[i].userId === userId.toString(), "HERE")
    if (users[i].userId == userId.toString()) {
      users[i]['sockets'].push(id);
      users[i]['rooms'].push(room);
      found = true;
      break;
    }
  }


  userId = userId.toString();
  if (!found) {
    users.push({
      sockets: [id],
      user,
      rooms: [room],
      userId
    })
  }
  console.log(users, "USERS")
  return users;
}

exports.currentUser = (id) => {
  return users.find(user => user.userId === id.toString());
}
exports.currentUserWithSocketId = (id) => {
  return users.find(user => user.sockets.includes(id));
}
exports.usersInRoom = (room) => {
  return users.filter(user => user.rooms.includes(room))
}

exports.userLeave = (id) => {
  const index = users.findIndex(user => user.id === id);
  if (index != -1) {
    return users.splice(index, 1)[0];
  }

}
// module.exports = insertUser;
