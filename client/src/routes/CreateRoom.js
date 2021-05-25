import React, {useState} from "react";
import { v1 as uuid } from "uuid";
import axios from 'axios';

const CreateRoom = (props) => {
    const [roomCapacity, setRoomCapacity] = useState(0);

    function create() {
        
        const id = uuid();
        const data ={
            roomCapacity,
            id,
        }
        props.history.push(`/room/${id}`);
        axios
        .post('http://localhost:8000/getData', data)
        .then(() => console.log('enter room'))
        .catch(err => {
            console.error(err);
        });
    }

    
    

    return (
        <>
            <div>
                <input placeholder="Enter the number of people you want in the room" 
                size="50" 
                onChange={(e) => {
                    setRoomCapacity(e.target.value); 
                    console.log("e.target.value is: ", roomCapacity);
                }}/>
            </div>
            
            <button onClick={create}>Create room</button>

        </>
        
    );
};

export default CreateRoom;
