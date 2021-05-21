import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";

// const socket = io("https://the-wolf-of-mafia.herokuapp.com/");
const socket = io("http://localhost:8000");

const Container = styled.div`
    padding: 20px;
    display: flex;
    height: 100vh;
    width: 90%;
    margin: auto;
    flex-wrap: wrap;
`;

const StyledVideo = styled.video`
    height: 40%;
    width: 50%;
`;

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <StyledVideo playsInline autoPlay ref={ref} />
    );
}


const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2
};

const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;

    useEffect(() => {
        socketRef.current = io("https://the-wolf-of-mafia.herokuapp.com/");
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(stream => {
           userVideo.current.srcObject = stream;
           
           //joined the room
           socketRef.current.emit("join room");

           //get all the users that are in the room
           socketRef.current.on("all users", users => {
               //new user so he has no peers
               const peers = [];
               users.forEach(userID => {
                   //for each one of the users in the room create a peer
                   const peer = createPeer(userID, socketRef.current.id, stream);
                   peersRef.current.push({
                       peerID: userID,
                       peer,
                   })
                   peers.push(peer);
               });
               setPeers(peers)
           })

           //tell other people that someone new joined
           socketRef.current.on("user joined", payload => {
               const peer = addPeer(payload.signal, payload.callerID, stream);
               peersRef.current.push({
                   peerID: payload.callerID, 
                   stream,
               });
               setPeers(users => [...users, peer]); 
           });
           socketRef.current.on("receiving returned signal", payload => {
               const item = peersRef.current.find(p => p.peerID === payload.id);
               item.peer.signal(payload.signal)
           })
        })
    }, []);

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            //initiator tells/signals the room that im here
            initiator: true, 
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", {userToSignal, callerID, signal})
        })

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
       const peer = new Peer({
           initiator: false,
           trickle: false, 
           stream
       })

       peer.on("signal", signal => {
           socketRef.current.emit("returning signal", {signal, callerID})
       })

       peer.signal(incomingSignal);
       return peer;
    }

    return (
        <Container>
            <StyledVideo muted ref={userVideo} autoPlay playsInline />
            {peers.map((peer, index) => {
                return (
                    <Video key={index} peer={peer} />
                );
            })}
        </Container>
    );
};

export default Room;
