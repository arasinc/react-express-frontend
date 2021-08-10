import React, {useState} from "react";
import { v1 as uuid } from "uuid";
import axios from 'axios';

import { FormControl } from 'react-bootstrap';
import ReactDOM from "react-dom";
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown'
const DEV_URL = "http://localhost:8000/"
const PROD_URL = "https://the-wolf-of-mafia.herokuapp.com/"

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
        .post(PROD_URL +'getData', data)
        .then(() => console.log('enter room'))
        .catch(err => {
            console.error(err);
        });
    }
    const [value,setValue]=useState('');
    const handleSelect=(e)=>{
        setRoomCapacity(parseInt(e.target.value)); 
        console.log("e.target.value is: ", e.target.value);
      }
     
    return (
        <>
            <div>
                <input placeholder="Enter the number of people you want in the room" 
                size="50" 
                onChange={(e) => {
                    setRoomCapacity(e.target.value); 
                    console.log("e.target.value is: ", e.target.value);
                }}/>



            </div>
            
            
            <button onClick={create}>Create room</button>

        </>
        
    );
};

export default CreateRoom;
