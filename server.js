require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const path = require("path");
const cors = require('cors');
const { Socket } = require('net');
const e = require('express');

// middleware needed to parse req.body
app.use(express.json());
app.use(express.urlencoded());

const users = [];
const users_in_each_room = {}
const socketToRoom = {};

//defualt room capacity to 4
var roomCapacity = 4;
var timer_duration = 0;

// Number each user when they enter the room 
var user_number = 1;
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
        if (users_in_each_room[roomID]) {
            const length = users_in_each_room[roomID].length;
            if (length === roomCapacity) {
                socket.emit("room full");
                return;
            }
            users_in_each_room[roomID].push(socket.id);
            var user = {id : socket.id, roomId: roomID, number: user_number};
            users.push(user)
            user_number += 1; 
        } else {
            users_in_each_room[roomID] = [socket.id];
            // Add player number
            user_number = 1;
            var user = {id : socket.id, roomId: roomID, number: user_number};
            users.push(user)
            user_number += 1; 
        }
        
        socketToRoom[socket.id] = roomID;
        var send_users = users.filter(function(el){
            return el.roomId === roomID;
        })
        console.log("users in room after: ", send_users)
        socket.emit("all users", send_users);
    });


    socket.on("sending signal", payload => {
        console.log("the caller id is: ", payload.callerID)
        var temp_user = {};
        for(const user in users){

            if(users[user].id === payload.callerID){
                temp_user = users[user]
            }
        }
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID, user: temp_user});
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users_in_each_room[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users_in_each_room[roomID] = room;
        }
    });

    socket.on('pause', payload => {
        io.emit('pausing videos', payload)
    })

    socket.on('timer', payload => {
        timer_duration = payload.timer
        startTimer(payload, io)
        console.log("useres are: ", users)
        
    })
});

function startTimer(payload, io){
    var temp_users = users_in_each_room[payload.roomId]
    var countD_down_timer = setInterval(function(){
        if (timer_duration <= 0) {
            console.log("user is: ", temp_users)
            if(temp_users.length <= 0 ){
                io.emit("start timer", {user_to_speak: "end"})
                clearInterval(countD_down_timer)
                
            }
            else{
                var temp_user = temp_users.pop()
                timer_duration = payload.timer
                io.emit("start timer", {user_to_speak: temp_user})
            }
            
        }else{
            timer_duration -= 1;
        }
    }, 1000);
}

if (process.env.PROD){
    app.use(express.static(path.join(__dirname, './client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, './client/build/index.html'));
    })
}
server.listen(process.env.PORT || 8000, () => console.log('server is running on port 8000'));