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
    padding: 10px;
`;

const Video = (props) => {
    const ref = useRef();
    const user = props.user;
    console.log("props is: ", props)
    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    useEffect(() => {
        console.log("props.gamestate is: ", props.gameState)
        if(props.gameState === "wake up mafia first night"){
            if(props.currentUserRole === "Mafia" && user.isMafia){
                ref.current.srcObject.getTracks()[1].enabled = true;
            }
            else{
                ref.current.srcObject.getTracks()[1].enabled = false;
            }
        }
        
        if(props.gameState === "first night timer end"){
            ref.current.srcObject.getTracks()[1].enabled = true;
        }
        
    }, [props])

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
    const [isRoomCreator, setIsRoomCreator] = useState(false);
    const [isMafia, setIsMafia] = useState();
    const [gameState, setGameState] = useState("before game start");
    const [personTalking, setPersonTalking] = useState();
    const userNum = useRef();
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const roomID = props.match.params.roomID;
    var users = [];

    
    useEffect(() => {

        socketRef.current = io.connect("/");
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;
            socketRef.current.emit("join room", roomID);
            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(user => {
                    //check if it is a cretor if yes let them have access to some stuff
                    if (user.isRoomCreator) setIsRoomCreator(true)
                    else setIsRoomCreator(false)
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
                setGameState("first day timer")
                if(socketRef.current.id === payload.user_to_speak){
                    setAudioOffOrOn(true)
                }
                else{
                    setAudioOffOrOn(false)
                }
            })

            socketRef.current.on('normal day timer', payload => {
                setGameState("normal day timer")
                if(socketRef.current.id === payload.user_to_speak){
                    setAudioOffOrOn(true)
                }
                else{
                    setAudioOffOrOn(false)
                }
            })
            
            socketRef.current.on('first day timer end', payload => {
                setGameState('first day timer end')
                console.log("first day ends");
                setAudioOffOrOn(false);
                setVideoOffOrOn(false);
                // First day ends and first night begins
                var obj = {roomId: roomID};
                socketRef.current.emit("first night timer", obj);
            })

            socketRef.current.on('first night timer end', payload =>{
                setGameState("first night timer end")
            })

            socketRef.current.on('wake up mafia first night', payload => {
                setGameState("wake up mafia first night");
                setVideoOffOrOn(true)
            })
        });
    }, []);
    useEffect(()=> {
        if(userVideo.current.srcObject !== null){
            userVideo.current.srcObject.getTracks()[1].enabled = videoOffOrOn;
            userVideo.current.srcObject.getTracks()[0].enabled = audioOffOrOn;
        }
    }, [videoOffOrOn, audioOffOrOn])
    
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
                <h3>Game stat is: {gameState}</h3>
            </div>
            <div>
            <Container>
                <StyledVideo muted ref={userVideo} autoPlay playsInline />
                {peers.map((peer, index) => {
                    return (
                        <Video key={index} peer={peer.peer} user={peer.user} currentUserRole={isMafia} gameState={gameState} />
                    );
                })}
            </Container>
            <p> muted is: {audioOffOrOn ? "not muted" : "Muted"}</p>
            <p> Number is {userNumber}</p><br></br>
            <p> You are a {isMafia} </p>
            </div>
        
            <div>
            <p>Wait for eveyone to join the room before starting the game</p>
            {isRoomCreator ? <button onClick={startTimerFunction}> Start The Game</button> : ""}
            
            </div>
        
        </div>
    );
};

export default Room;