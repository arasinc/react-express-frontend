
import React, {useState} from "react";
import img from "./8-dribbble.jpg";
import { v1 as uuid } from "uuid";
import axios from 'axios';




const Characters = (props) => {
    

    function create() {
        
        
        props.history.push(`/Characters`);
        
    }


    return (
        <>
            <div>
            <nav class="navbar navbar-expand-sm navbar-dark bg-dark mb-3">
        <div class="container">
            <a class="navbar-brand" href="/HomePage">Home</a>
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" href="#">Characters</a>
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
    <div>
        <div class="card">
            <div class="card-header">
                Mafia
            </div>
            <div class="card-body">
                <h4 class="card-title">Bartender</h4>
                <p class="card-text">The Bartender will not wake with the Mafia at night.<br></br> 
                The Bartender will appear as a civilian if visited by the Detective or Interrogator.<br></br>
The Bartender will select a player every night and the selected player will lose its
ability that night.<br></br> Cannot select a player twice in a row.</p>
                <a class="btn btn-danger" href="#">Read More</a>
            </div>
        </div>
        <div><p>  </p></div>
        <div class="card">
            <div class="card-header">
                Mafia
            </div>
            <div class="card-body">
                <h4 class="card-title">GodFather</h4>
                <p class="card-text">The Godfather wakes and acts with the Mafia each night.<br></br>
The Godfather will appear as a civilian if visited by the Detective or Interrogator.</p>
                <a class="btn btn-danger" href="#">Read More</a>
            </div>
        </div>


            
    </div>


        
            </div>
            
           

        </>
        
    );
};

export default Characters;
