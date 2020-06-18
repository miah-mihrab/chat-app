let users = [];


exports.insertUser = (id, user, room, userId) => {
  let found = false;
  for (let i = 0; i < users.length; i++) {

    console.log(users[i].userId === userId.toString(), "HERE")
    if (users[i].userId == userId.toString()) {
      found = true;
      break;
    }
  }
  userId = userId.toString();
  if (!found) {
    users.push({
      id,
      user,
      room,
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
  return users.find(user => user.id === id);
}
exports.usersInRoom = (room) => {
  return users.filter(user => user.room === room)
}

exports.userLeave = (id) => {
  const index = users.findIndex(user => user.id === id);
  if (index != -1) {
    return users.splice(index, 1)[0];
  }

}
// module.exports = insertUser;
