import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import axios from 'axios';

const Container = styled.div`
    padding: 20px;
    display: flex;
    height: 300px;
    width: 90%;
    margin: auto;
    flex-wrap: wrap;
`;

const StyledVideo = styled.video`
    height: 200px;
    width: 300px;
    padding: 20px;
`;

const Video = (props) => {
    console.log("props aree: ", props)
    const ref = useRef();
    const user_number = props.number
    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
            
        })
    }, []);

    return (
        <>
        <div>
        <StyledVideo playsInline autoPlay ref={ref} />
        {user_number}
        </div>
        
        </>
    );
}

const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2
};

const Room = (props) => {
    const normalTalkCounter = 5;
    // const defendingCounter = 120;
    const [peers, setPeers] = useState([]);
    const [videoOffOrOn, setVideoOffOrOn] = useState(true);
    const [counter, setCounter] = useState(normalTalkCounter);
    const [startTimer, setStartTimer] = useState(false);
    const [userNumber, setUserNumber] = useState();
    const userNum = useRef();
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;
    var users = []

    
    useEffect(() => {

        socketRef.current = io.connect("/");
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false }).then(stream => {
            userVideo.current.srcObject = stream;
            socketRef.current.emit("join room", roomID);
            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(user => {
                    setUserNumber(user.number)
                    userNum.current = user.number
                    if(user.id !== socketRef.current.id){
                    const peer = createPeer(user.id, socketRef.current.id, stream, user);
                    peersRef.current.push({
                        peerID: user.id,
                        peer,
                    })
                    //{peers: peers, user: user}
                    peers.push({peers: peers, user: user});
                  }
                })
                setPeers(peers);
            });

            socketRef.current.on("user joined", payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                });
                console.log("user is: ", payload.user)
                setPeers(prePeer => [...prePeer, {peer:peer, user:payload.user}]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });
            socketRef.current.on('start timer', payload => {
                console.log("the socketref current is: " , socketRef.current.id)
                console.log("the payload id is: ",payload.user_to_speak )
                if(socketRef.current.id === payload.user_to_speak || payload.user_to_speak === "end"){
                    setVideoOffOrOn(false)
                }
                else{
                    setVideoOffOrOn(true)
                }
            })
        });
        
    }, []);
    useEffect(()=> {
        if(userVideo.current.srcObject !== null){
            userVideo.current.srcObject.getTracks()[1].enabled = videoOffOrOn;
        }
    }, [videoOffOrOn])
    
    // commenting the frontend timer for now. maybe will need it later
    // // Timer 
    // useEffect(() => {
    //     if(startTimer){
    //         if ( counter > 0 ){
    //             setTimeout(() => setCounter(counter - 1), 1000)
    //         }
    //         else {
    //             setCounter(normalTalkCounter)
    //         }
    //     }
    //   }, [counter, startTimer]);

    function startTimerFunction () {

        var obj = {timer: normalTalkCounter, roomId: roomID}
        socketRef.current.emit('timer', obj);
        setCounter(normalTalkCounter)
        setStartTimer(true)
    }

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        });

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    return (
        <div>
        <div>
        <Container>
            <StyledVideo muted ref={userVideo} autoPlay playsInline />
            {peers.map((peer, index) => {
            
                return (
                    <Video key={index} peer={peer}  />
                );
            })}
        </Container>
        <p> number is {userNumber}</p>
        </div>

        <div>
        <p>Wait for eveyone to join the room before starting the game</p>
        <button onClick={startTimerFunction}> Start The Game</button><br/>
        </div>
        
        </div>
    );
};

export default Room;