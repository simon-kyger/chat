var app = require('express')();
var server = require('http').Server(app);
var moment = require('moment');
var request = require('request');
var io = require('socket.io')(server);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
server.listen(80);

var SOCKET_CONNECTIONS = [];

//socket: object
//description: consider this as a looping system, since sockets are persistant, 
//the contents inside are always being evaluated.  this is the main loop of the program.
io.sockets.on('connection', function (socket) {
    init(socket);
    socket.on('disconnect', () => disconnects(socket));
    socket.on('chatMsg', (msg) => chatMsg(socket, msg));
});

//socket: object
//returns: void
//description: static method that only occurs once per connection to server is establish
function init(socket){
    var now = new moment();
    SOCKET_CONNECTIONS.push(socket);
    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++){
        SOCKET_CONNECTIONS[i].emit('addToChat', {
            date: now.format("HH:mm:ss"),
            name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
            msg:  'User ' + SOCKET_CONNECTIONS.indexOf(socket) + ' has connected.',
            color: socket.color
        });
        SOCKET_CONNECTIONS[i].emit('updateUsers', getNames(SOCKET_CONNECTIONS));
    }
}

//socket: object
//returns: void
//description: events that occur after a user disconnects from the server
function disconnects(socket){
    var now = new moment();
    var temp; //storing disconnected user
    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++){
        if(SOCKET_CONNECTIONS[i].id == socket.id){
            temp = i;
            continue;
        }
        SOCKET_CONNECTIONS[i].emit('addToChat', {
            date: now.format("HH:mm:ss"),
            name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
            msg:  ' has disconnected.', 
            color: socket.color
        });
    }
    SOCKET_CONNECTIONS.splice(temp, 1);
    for (let j =0; j < SOCKET_CONNECTIONS.length; j++){     
        SOCKET_CONNECTIONS[j].emit('updateUsers', getNames(SOCKET_CONNECTIONS));
    }
}

//socket: object
//msg: string
//returns: void
function chatMsg(socket, msg){ 
    var now = new moment();
    if (msg.indexOf('<') > -1)
        msg = msg.replace(new RegExp(/</, 'g'), '&lt');
    if (msg.substr(0, 1) == '/'){
        command(socket, msg);
        return;
    }
    var container = msg.split(' ');
    for (var i=0; i<container.length; i++){
        if ((container[i].substr(0, 8)) == 'https://' || (container[i].substr(0, 7)) == 'http://'){
            var ext = container[i].substr(container[i].length-3, 3);
            if (ext == 'gif' || ext == 'jpg' || ext == 'png' || ext == 'mp4' || ext == 'tif'){
                container[i] = '<img src="'+container[i]+'" target="_blank" style="width: auto; max-height: 300px; max-width: 300px;">';
            } else {
                container[i] = '<a href="'+container[i]+'" target="_blank">'+container[i]+'</a>';
            }
        }
    }
    msg = container.join(' ');
    for (var i = 0; i < SOCKET_CONNECTIONS.length; i++) {
        SOCKET_CONNECTIONS[i].emit('addToChat', {
            date: now.format("HH:mm:ss"),
            name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
            msg:  msg, 
            color: socket.color
        });
    }
}


//socket: object
//msg: string
//returns: void
//description: directs commands sent to server by client.
function command(socket, msg){
    var now = new moment();
    var command = msg.substr(0, msg.indexOf(' ')) || msg;
    var mod = msg.substr(command.length);
    if (command === '/color'){
        socket.color = mod;
        socket.emit('changeInputFontColor', socket.color);
    } else if (command === '/name'){
        if(mod.length > 20){
            socket.emit('addToChat', { 
                date: now.format("HH:mm:ss"),
                name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                msg:  'Use <20 characters for name plz.',
                color: 'red'
            });
            return;
        }
        var oldname = socket.name || SOCKET_CONNECTIONS.indexOf(socket);
        socket.name = mod || SOCKET_CONNECTIONS.indexOf(socket);
        for (var i = 0; i < SOCKET_CONNECTIONS.length; i++) {
            SOCKET_CONNECTIONS[i].emit('addToChat', {
                date: now.format("HH:mm:ss"),
                name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                msg: oldname + ' is now known as: ' + socket.name, 
                color: 'darkred'
            });
            SOCKET_CONNECTIONS[i].emit('updateUsers', getNames(SOCKET_CONNECTIONS));
        }
    } else if (command === '/theme'){
        socket.theme = mod;
        socket.emit('changeTheme', socket.theme);
    } else if (command === '/gif') {
        request('http://api.giphy.com/v1/gifs/search?q='+mod+'&api_key=mIXP4ZfFAYQ1feYwdQhvbJOsvmwY3qB2&limit=1', function (error, response, body) {
            var ret = JSON.parse(body);
            ret = ret.data[0].images.original.url;
            chatMsg(socket, mod);
            chatMsg(socket, ret);
        });
    } else {
        socket.emit('addToChat', {
            date: now.format("HH:mm:ss"),
            name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
            msg: 'Unknown command: '+command,
            color: 'red'
        });
    }
}

//arg: array
//returns: array
//description: basically how to get the names of all connected clients 
//even if they are still an array index
function getNames(arg){
    var ret =[];
    for(var i=0; i<arg.length; i++){
        if(arg[i].name)
            temp = arg[i].name.trim();
        else
            temp = i;
        ret.push(temp)
    }
    return ret;
}