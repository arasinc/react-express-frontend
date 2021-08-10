import React, {useState} from "react";
import img from "./8-dribbble.jpg";
import { v1 as uuid } from "uuid";
import axios from 'axios';




const HomePage = (props) => {
    

    function create() {
        
        
        props.history.push(`/CreateRoom`);
        
    }


    return (
        <>
            <div>
            <nav class="navbar navbar-expand-sm navbar-dark bg-dark mb-3">
        <div class="container">
            <a class="navbar-brand" href="#">Home</a>
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" href="/Characters">Characters</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#">About</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#">Modes</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#">Contact</a>
                </li>
                <li class="nav-item">
                    
                    <a class="btn btn-danger btn-block" href='/CreateRoom'>Play</a>
                </li>
            </ul>
        </div>
    </nav>
        
        <div class="text-center">
  <img src={img} class="rounded" alt="..."/>
        </div>
    
            </div>
            
           

        </>
        
    );
};

export default HomePage;
