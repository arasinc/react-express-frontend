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
    const normalTalkCounter = 3;
    // const defendingCounter = 120;
    const [peers, setPeers] = useState([]);
    const [onOrOff, setOnOrOFF] = useState("off");
    const [videoOffOrOn, setVideoOffOrOn] = useState(true);
    const [counter, setCounter] = useState(normalTalkCounter);
    const [startTimer, setStartTimer] = useState(false);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;
    
    
    useEffect(() => {

        socketRef.current = io.connect("/");
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;
            socketRef.current.emit("join room", roomID);
            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    })
                    peers.push(peer);
                })
                setPeers(peers);
            });

            socketRef.current.on("user joined", payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                });

                setPeers(users => [...users, peer]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });
            socketRef.current.on('pausing videos', payload => {
                setVideoOffOrOn(payload)
            })
            // socketRef.current.on('start timer', payload => {
            //     console.log("the timer payload is: ", payload)
            //     setCounter(payload.timer)
            // })
        });
        
    }, []);
    useEffect(()=> {
        if(userVideo.current.srcObject !== null){
            userVideo.current.srcObject.getTracks().forEach(t => t.enabled = videoOffOrOn);
        }
    }, [videoOffOrOn])
    
    // Timer 
    useEffect(() => {
        if(startTimer){
            if ( counter > 0 ){
                setTimeout(() => setCounter(counter - 1), 1000)
            }
            else {
                setCounter(normalTalkCounter)
                socketRef.current.emit('pause', !videoOffOrOn);
            }
        }
      }, [counter, startTimer]);
    function startTimerFunction () {

        var obj = {timer: normalTalkCounter}
        socketRef.current.emit('timer', obj);
        setCounter(normalTalkCounter)
        setStartTimer(true)
    }

    function turnOffOROnYourVideo() {
        console.log("video turned off");
        onOrOff === "on"?setOnOrOFF("off"):setOnOrOFF("on");
        setVideoOffOrOn(false);
    }

    function turnOffAllVideos() {
        var obj = {id:socketRef.current.id , vid: false}
        socketRef.current.emit('pause', obj);
        console.log("turnoff all videos")
        // console.log("socketref current is: " , socketRef.current)
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
            stream,
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    return (
        <div>
        <div>Countdown: {counter}</div>
        <Container>
            <StyledVideo muted ref={userVideo} autoPlay playsInline />
            {peers.map((peer, index) => {
                return (
                    <Video key={index} peer={peer} />
                );
            })}
        </Container>
        <button onClick={startTimerFunction}> Start/Stop timer</button><br/>
        <button onClick={turnOffOROnYourVideo}> Turn {onOrOff} your video </button> <br/>
        <button onClick={turnOffAllVideos}> Turn off all Videos </button> <br/>
        
        </div>
    );
};

export default Room;