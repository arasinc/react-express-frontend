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
const users_in_each_room = {};
const socketToRoom = {};
const group = [{name: "Mafia"}, {name: "civilian"}];

// Figuring out mafia members
const chooseNumberOfMafia = {7:1, 8:2, 9:2, 10:3};
var numberOfMafia = 1;
var randomNumForMafia = [];
var isMafia = false;

//defualt room capacity to 4
var roomCapacity = 4;

// Timer Durations
var firstDayTimerDuration = 2;
var firstNightTimerDuration = 10;
var normalDayTimerDuration = 0;
var normalNightTimerDuration = 0;

// Number each user when they enter the room 
var user_number = 1;
//use cors to allow cross origin resource sharing
app.use(
    cors({
      origin: 'http://localhost:3000',
    })
  );

app.post("/getData", function(req, res) {
    randomNumForMafia = []
    roomCapacity = parseInt(req.body.roomCapacity);
    numberOfMafia = findNumberOfMafia();
    console.log("number of mafia is: ", numberOfMafia);

    // Choose roles for users randomly 
    var i = 0;
    while(i < numberOfMafia){
        var randNumber = Math.floor(Math.random() * roomCapacity + 1);
        if(!randomNumForMafia.includes(randNumber)){
            randomNumForMafia.push(randNumber);
            i++;
        }
    }
})

io.on('connection', socket => {
    socket.on("join room", roomID => {
        if(randomNumForMafia.includes(user_number)){
            isMafia = true;
        }else{
            isMafia = false;
        }
        if (users_in_each_room[roomID]) {
            const length = users_in_each_room[roomID].length;
            if (length === roomCapacity) {
                socket.emit("room full");
                return;
            }

            users_in_each_room[roomID].push(socket.id);
            // Randomly choosing Mafia 
            var user = {id : socket.id, roomId: roomID, number: user_number, isMafia: isMafia};
            users.push(user)
            user_number += 1; 
        } else {
            users_in_each_room[roomID] = [socket.id];
            // Add player number and choose mafia
            user_number = 1;
            var user = {id : socket.id, roomId: roomID, number: user_number, isMafia: isMafia};
            users.push(user)
            user_number += 1;
        }
        
        socketToRoom[socket.id] = roomID;
        var send_users = users.filter(function(el){
            return el.roomId === roomID;
        })
        socket.emit("all users", send_users);
    });

    socket.on("sending signal", payload => {
        var tempUser = {};
        for(const user in users){

            if(users[user].id === payload.callerID){
                tempUser = users[user]
            }
        }
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID, user: tempUser});
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
        firstDayTimer(payload, io)
    })

    socket.on('first night timer', payload => {
        firstNightTimer(payload, io)
    })
});

function firstNightTimer(payload, io) {
    var mafiaUsers = users.filter(user => user.isMafia === true && user.roomId === payload.roomId)
    var tempTimer = firstNightTimerDuration
    io.emit("wake up mafia first day", {mafia:mafiaUsers})
    var countD_down_timer = setInterval(function(){
        if (tempTimer <= 0) {
            io.emit('first night timer end')
            clearInterval(countD_down_timer)
            
        }else{
            tempTimer -= 1;
        }
    }, 1000);
    
}

// Function to start the game
function firstDayTimer(payload, io){
    var tempUsers = [...users_in_each_room[payload.roomId]]
    var tempTimer = firstDayTimerDuration
    var countD_down_timer = setInterval(function(){
        if (tempTimer <= 0) {
            if(tempUsers.length <= 0 ){
                io.emit("first day timer end")
                clearInterval(countD_down_timer)
            }
            else{
                var tempUser = tempUsers.pop()
                tempTimer = firstDayTimerDuration
                io.emit("first day timer", {user_to_speak: tempUser})
            }
        }else{
            tempTimer -= 1;
        }
    }, 1000);
    
}

// Function to find the number of Mafia
function findNumberOfMafia() {
    for(var key in chooseNumberOfMafia){
        if(roomCapacity === parseInt(key)){
            console.log('we enter here with choose: ', chooseNumberOfMafia[key])
            return chooseNumberOfMafia[key];
        }
    }
    return 1
}

if (process.env.PROD){
    app.use(express.static(path.join(__dirname, './client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, './client/build/index.html'));
    })
}
server.listen(process.env.PORT || 8000, () => console.log('server is running on port 8000'));