const express = require('express');
const app = express();  
const server = require('http').Server(app);
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const request = require('request');
const io = require('socket.io')(server);
const giphyapikey = 'mIXP4ZfFAYQ1feYwdQhvbJOsvmwY3qB2';

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

server.listen(80);

var SOCKET_CONNECTIONS = [];

//socket: object
//description: consider this as a looping system, since sockets are persistant, 
//the contents inside are always being evaluated.  this is the main loop of the program.
io.sockets.on('connection', (socket) => {
    init(socket);
    socket.on('disconnect', () => disconnects(socket));
    socket.on('chatMsg', (msg) => chatMsg(socket, msg));
});

//socket: object
//returns: void
//description: static method that only occurs once per connection to server is establish
function init(socket){
    const now = new moment();
    SOCKET_CONNECTIONS.push(socket);
    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++){
        SOCKET_CONNECTIONS[i].emit('addToChat', {
            date: now.format("HH:mm:ss"),
            name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
            msg:  `User ${SOCKET_CONNECTIONS.indexOf(socket)} has connected.`,
            color: socket.color
        });
        SOCKET_CONNECTIONS[i].emit('updateUsers', getNames(SOCKET_CONNECTIONS));
    }
}

//socket: object
//returns: void
//description: events that occur after a user disconnects from the server
function disconnects(socket){
    const now = new moment();
    let temp; //storing disconnected user
    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++){
        if(SOCKET_CONNECTIONS[i].id == socket.id){
            temp = i;
            continue;
        }
        SOCKET_CONNECTIONS[i].emit('addToChat', {
            date: now.format("HH:mm:ss"),
            name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
            msg:  ` has disconnected.`, 
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
    const now = new moment();
    if (msg.indexOf('<') > -1)
        msg = msg.replace(new RegExp(/</, 'g'), '&lt');
    if (msg.substr(0, 1) == '/'){
        command(socket, msg);
        return;
    }
    let container = msg.split(' ');
    for (let i=0; i<container.length; i++){
        if ((container[i].substr(0, 8)) == 'https://' || (container[i].substr(0, 7)) == 'http://'){
            let ext = container[i].substr(container[i].length-3, 3);
            if (ext == 'gif' || ext == 'jpg' || ext == 'png' || ext == 'mp4' || ext == 'tif'){
                container[i] = `<a href="${container[i]}" target="_blank"><img src="${container[i]}" target="_blank" style="width: auto; max-height: 300px; max-width: 300px;border-radius: 10px;"></a>`;
            } else {
                container[i] = `<a href="${container[i]}" target="_blank">${container[i]}</a>`;
            }
        }
    }
    msg = container.join(' ');
    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++) {
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
    const now = new moment();
    let command = msg.substr(0, msg.indexOf(' ')) || msg;
    let mod = msg.substr(command.length+1);
    switch(command){     
        case '/color':
            socket.color = mod;
            socket.emit('changeInputFontColor', socket.color);
            break;
        case '/gif':
            giphyrequest(socket, mod, now);
            break;
        case '/name':
            if(mod.length > 20 || mod.length < 1){
                socket.emit('addToChat', { 
                    date: now.format("HH:mm:ss"),
                    name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                    msg:  'Use 1-20 characters for your name plz',
                    color: 'red'
                });
                return;
            }
            let oldname = socket.name || SOCKET_CONNECTIONS.indexOf(socket);
            socket.name = mod || SOCKET_CONNECTIONS.indexOf(socket);
            for (let i = 0; i < SOCKET_CONNECTIONS.length; i++) {
                SOCKET_CONNECTIONS[i].emit('addToChat', {
                    date: now.format("HH:mm:ss"),
                    name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                    msg: `${oldname} is now known as: ${socket.name}`, 
                    color: 'red'
                });
                SOCKET_CONNECTIONS[i].emit('updateUsers', getNames(SOCKET_CONNECTIONS));
            }
            break;
        case '/theme':
            socket.theme = mod;
            socket.emit('changeTheme', socket.theme);
            break;
        default:
            socket.emit('addToChat', {
                date: now.format("HH:mm:ss"),
                name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                msg: `Unknown command: ${command}`,
                color: 'red'
            });
    }
}

//socket: object
//mod: string
//now: string 
//description: part of command lib that will fetch mod from giphy.com
function giphyrequest(socket, mod, now){
    let link = `http://api.giphy.com/v1/gifs/search?q=${mod}&api_key=${giphyapikey}&limit=1`;
    request.get(link, function (error, response, body) {
        if (error){
            //giphy is down
            socket.emit('addToChat', { 
                date: now.format("HH:mm:ss"),
                name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                msg:  `Giphy appears to be down? Try again later`,
                color: 'red'
            });
            return;
        }
        let ret = JSON.parse(body).data[0];
        if(ret){
            //giphy is up, and images came back
            ret = ret.images.original.url;
            for (let i =0; i<SOCKET_CONNECTIONS.length; i++){
                SOCKET_CONNECTIONS[i].emit('addToChat', {
                    date: now.format("HH:mm:ss"),
                    name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                    msg: `<a href="${ret}" target="_blank">${ret}</a>`, 
                    color: socket.color
                });
            }
            chatMsg(socket, ret);
        } else {
            //giphy is up, but no images came back or query was shit
            socket.emit('addToChat', { 
                date: now.format("HH:mm:ss"),
                name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                msg:  `Giphy failed to return anything for search->'${mod}'`,
                color: 'red'
            });
            socket.emit('addToChat', { 
                date: now.format("HH:mm:ss"),
                name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                msg:  `Sorry about that, here's a sad puppy instead:`,
                color: 'red'
            });

            //static file send
            fs.readFile('./img/sadpuppy.jpg', function(err, data){
                socket.emit('image', { 
                    date:   now.format("HH:mm:ss"),
                    name:   (socket.name || SOCKET_CONNECTIONS.indexOf(socket)), 
                    msg:    data.toString("base64")
                });
            });
        }
    });
}

//arg: array
//returns: array
//description: basically how to get the names of all connected clients 
//even if they are still an array index
function getNames(arg){
    let ret =[];
    let temp;
    for(let i=0; i<arg.length; i++){
        if(arg[i].name)
            temp = arg[i].name.trim();
        else
            temp = i;
        ret.push(temp)
    }
    return ret;
}