import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";

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
    const user = props.user
    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
            
        })
    }, []);

    return (
        <>
        <div>
        <StyledVideo playsInline autoPlay ref={ref} />
        {user.number}
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
    const [audioOffOrOn, setAudioOffOrOn] = useState(true)
    const [counter, setCounter] = useState(normalTalkCounter);
    const [startTimer, setStartTimer] = useState(false);
    const [userNumber, setUserNumber] = useState();
    const [isMafia, setIsMafia] = useState();
    const userNum = useRef();
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;
    var users = []

    
    useEffect(() => {

        socketRef.current = io.connect("/");
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;
            socketRef.current.emit("join room", roomID);
            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(user => {
                    
                    // check if they are mafia
                    setUserNumber(user.number)
                    if(user.id === socketRef.current.id && user.isMafia)setIsMafia("Mafia")
                    else setIsMafia("Civilian")

                    userNum.current = user.number
                    if(user.id !== socketRef.current.id){
                    const peer = createPeer(user.id, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: user.id,
                        peer,
                    })
                    //{peers: peers, user: user}
                    peers.push({peer: peer, user: user});
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
                setPeers(prePeer => [...prePeer, {peer:peer, user:payload.user}]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });
            socketRef.current.on('first day timer', payload => {
                if(socketRef.current.id === payload.user_to_speak){
                    setAudioOffOrOn(true)
                }
                else{
                    setAudioOffOrOn(false)
                }
            })
            socketRef.current.on('first day timer end', payload => {
                console.log("first day ends")
                setAudioOffOrOn(false)
                setVideoOffOrOn(false)
                // First day ends and first night begins
                var obj = {roomId: roomID}
                socketRef.current.emit("first night timer", obj)
            })

            socketRef.current.on('first night timer end', payload =>{
                console.log("first night ended")
                setVideoOffOrOn(true)
                setAudioOffOrOn(true)
            })

            socketRef.current.on('wake up mafia first day', payload => {
                console.log("mafia payload is: ", payload);
                for(var mafia of payload.mafia){
                    console.log("index of payload is: ", mafia)
                    if(mafia.id === socketRef.current.id){
                        setVideoOffOrOn(true)
                    }
                }
            })
        });
    }, []);
    useEffect(()=> {
        if(userVideo.current.srcObject !== null){
            userVideo.current.srcObject.getTracks()[1].enabled = videoOffOrOn;
            userVideo.current.srcObject.getTracks()[0].enabled = videoOffOrOn;
        }
    }, [videoOffOrOn])
    
    function startTimerFunction () {

        var obj = {roomId: roomID}
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
                    <Video key={index} peer={peer.peer} user={peer.user}  />
                );
            })}
        </Container>
        <p> muted is: {audioOffOrOn ? "not muted" : "Muted"}</p>
        <p> Number is {userNumber}</p><br></br>
        <p> You are a {isMafia} </p>
        </div>
        
        <div>
        <p>Wait for eveyone to join the room before starting the game</p>
        <button onClick={startTimerFunction}> Start The Game</button><br/>
        </div>
        
        </div>
    );
};

export default Room;