let users = [];


exports.insertUser = (id, user, room) => {
    users.push({
        id,
        user,
        room
    })
    return users;
}

exports.currentUser = (id) => {
    return users.find(user => user.id === id);
}
exports.usersInRoom = (room) => {
    return users.filter(user => user.room === room)
}

exports.userLeave = (id) => {
    const index = users.findIndex(user => user.id === id);
    console.log('index: ' + index)
    if (index != -1) {
        return users.splice(index, 1)[0];
    }

}
// module.exports = insertUser;