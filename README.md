##Installation 
go to the server directory and run the following commands: 
1. yarn add nodemon
2. yarn add dotenv

use cd client to go to the client directory
1. yarn add react-bootstrap bootstrap@5.0.2
use cd .. to go to the main directory

##To Start in Dev mode
Go to the main directory (not the client one. The server one)
```
$ nodemon server.js
$ cd client
$ yarn start
```

### Applications to download
1. visual studio code
2. git bash for windows users

## Env Run
If you are running the code on local host make sure to choose the "DEV_ENV" in createroom.js
If you are running the code on prod then choose the "PROD_ENV" if you don't then you will get errors