import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./routes/CreateRoom";
import HomePage from "./routes/HomePage";
import Room from "./routes/Room";
import Characters from "./routes/Characters";
import "bootstrap/dist/css/bootstrap.min.css";


function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={HomePage} />
        <Route path="/CreateRoom" component={CreateRoom} />
        <Route path="/room/:roomID" component={Room} />
        <Route path="/Characters" component={Characters} />

      </Switch>
    </BrowserRouter>
  );
}

export default App;
