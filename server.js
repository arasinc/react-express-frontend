require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const path = require("path");
const cors = require('cors');

// middleware needed to parse req.body
app.use(express.json());
app.use(express.urlencoded());

const users = {};
const socketToRoom = {};

//defualt room capacity to 4
var roomCapacity = 4;

//use cors to allow cross origin resource sharing
app.use(
    cors({
      origin: 'http://localhost:3000',
    })
  );

app.post("/getData", function(req, res) {
    roomCapacity = parseInt(req.body.roomCapacity);

})

app.get("/getUsers", function(req, res) {
    roomCapacity = parseInt(req.body.roomCapacity);
})

io.on('connection', socket => {
    socket.on("join room", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === roomCapacity) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

        socket.emit("all users", usersInThisRoom);
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }

    });

});

if (process.env.PROD){
    app.use(express.static(path.join(__dirname, './client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, './client/build/index.html'));
    })
}


server.listen(process.env.PORT || 8000, () => console.log('server is running on port 8000'));