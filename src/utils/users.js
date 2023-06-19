const users = [];

// add user
const addUser = ({ id, username, room }) => {
  // Clean the data
  username = String(username).trim().toLowerCase();
  room = String(room).trim().toLowerCase();

  // Validate the data
  if (!username || !room) {
    return {
      error: "username and room are required",
    };
  }

  // Check for existing user in a room
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
  });

  // Validate username
  if (existingUser) {
    return {
      error: "username in use!",
    };
  }

  // Store user
  const user = { id, username, room };
  users.push(user);
  return { user };
};

// remove user
const removerUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

// get user
const getUser = (id) => {
  return users.find((user) => user.id === id);
};

// get users in a room
const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room);
};

module.exports = {
  addUser,
  removerUser,
  getUser,
  getUsersInRoom,
};
