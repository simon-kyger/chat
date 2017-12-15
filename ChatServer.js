const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const uuid = require('uuid');
const config = require('config');
const port = config.get('port');


app.use('/', express.static(path.join(__dirname, 'client')));

server.listen(port);
console.log(`Listening on port: ${port}`);


var users = [];

var init = (socket) => {

};




io.sockets.on('connection', (socket) => {
  console.log("connected...");
  socket.emit('bootstrap', config.get('client.bootstrap'));
  socket.emit('addToChat', {message:'Hello, world!'});
  socket.emit('updateUsers', {users:['bob', 'john']});
  socket.emit('updateUsers', {users:['frank', 'john']});

    //init(socket);
});


module.exports = function() {


};
