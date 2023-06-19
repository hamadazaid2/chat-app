const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removerUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();

const server = http.createServer(app);

const io = socketio(server);

app.use(express.static(path.join(__dirname, "../public")));

io.on("connect", (socket) => {
  //   // Send welcoming message to the client
  //   socket.emit("message", generateMessage("Welcome!"));
  //   socket.broadcast.emit("message", generateMessage("A new user has joined!")); // is going to send it to everybody excpet this particular socket

  socket.on("join", (options, callback) => {
    // options => {username, room}
    const { error, user } = addUser({ id: socket.id, ...options });

    // ERROR
    if (error) return callback(error);

    socket.join(user.room);
    // What we will use:
    // 1) io.to.emit => Emit an event to everybody in a specific room.
    // 2) socket.broadcast.to.emit => sending an event to everyone in a room except for the specific client who sent the message

    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined!`)
      );

    // Display room name and users are in the room in sidebar
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    // User joined to the room without any error
    callback();
  });

  // Recive a boradcasted message
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    // Filter bad words
    if (filter.isProfane()) {
      //  ACK: Deliverd to the server but not forwarded
      return callback(generateMessage("Profanity is not allowed !"));
    }

    // Send message for all clients (Broadcast)
    io.to(user.room).emit("message", generateMessage(user.username, message));
    // acknowledgement
    callback(); // ACK: Deliverd to the server and forwared sucessfully
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(user.username, coords.latitude, coords.longitude)
    );
    callback("Location Shared");
  });

  socket.on("disconnect", () => {
    const user = removerUser(socket.id);

    if (user) {
      // if user successfuly left
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left!`)
      );

      // When user left the room -> refresh the data
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`server is up on ${port}`);
});
