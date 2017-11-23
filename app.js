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
    var address = socket.request.connection.remoteAddress;
    let send = {
        chatmessages: [{
            action: 'renderText',
            date: now.format("HH:mm:ss"),
            name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
            msg:  `User ${address} has connected.`,
            color: socket.color
        }]
    };
    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++){
        SOCKET_CONNECTIONS[i].emit('addToChat', send);
        SOCKET_CONNECTIONS[i].emit('updateUsers', getNames(SOCKET_CONNECTIONS));
    }
}

//socket: object
//returns: void
//description: events that occur after a user disconnects from the server
function disconnects(socket){
    const now = new moment();
    let temp; //storing disconnected user
    let send = {
        chatmessages: [{
            action: 'renderText',
            date: now.format("HH:mm:ss"),
            name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
            msg:  `User ${SOCKET_CONNECTIONS.indexOf(socket)} has disconnected.`,
            color: socket.color
        }]
    };
    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++){
        if(SOCKET_CONNECTIONS[i].id == socket.id){
            temp = i;
            continue;
        }
        SOCKET_CONNECTIONS[i].emit('addToChat', send);
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
    let send = {
        chatmessages: [{
            action: 'renderText',
            date: now.format("HH:mm:ss"),
            name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
            msg:  msg,
            color: socket.color
        }]
    };

    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++) {
        SOCKET_CONNECTIONS[i].emit('addToChat', send);
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
    let send;
    switch(command){
        case '/code':
            send = {
                chatmessages: [{
                    action: 'renderCodeBlock',
                    date: now.format("HH:mm:ss"),
                    name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                    msg:  mod,
                    color: socket.color
                }]
            };
            socket.emit('addToChat', send);
            return;
        case '/color':
            socket.color = mod;
            socket.emit('changeInputFontColor', socket.color);
            break;
        case '/gif':
            giphyrequest(socket, mod, now);
            break;
        case '/name':
            changename(socket, mod, now);
            break;
        case '/theme':
            socket.theme = mod;
            socket.emit('changeTheme', socket.theme);
            break;
        default:
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                    msg:  `Unknown command: ${command}`,
                    color: `red`
                }]
            };
            socket.emit('addToChat', send);
    }
}

//socket: object
//mod: string
//description: part of command lib that will allow a user to change their name
function changename(socket, mod){
    const now = new moment();
    let send;
    if(mod.length > 20 || mod.length < 1){
        send = {
            chatmessages: [{
                action: 'renderText',
                date: now.format("HH:mm:ss"),
                name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                msg:  `Use 1-20 characters for your name plz`,
                color: socket.color
            }]
        };
        socket.emit('addToChat', send);
        return;
    } else {
        let oldname = socket.name || SOCKET_CONNECTIONS.indexOf(socket);
        socket.name = mod || SOCKET_CONNECTIONS.indexOf(socket);
        send = {
            chatmessages: [{
                action: 'renderText',
                date: now.format("HH:mm:ss"),
                name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                msg:  `${oldname} is now known as: ${socket.name}`, 
                color: `red`
            }]
        };
        for (let i = 0; i < SOCKET_CONNECTIONS.length; i++) {
            SOCKET_CONNECTIONS[i].emit('addToChat', send);
            SOCKET_CONNECTIONS[i].emit('updateUsers', getNames(SOCKET_CONNECTIONS));
        }
    }
}

//socket: object
//mod: string
//description: part of command lib that will fetch mod from giphy.com
function giphyrequest(socket, mod){
    const now = new moment();
    let send;
    if (mod.indexOf('#') > -1){
        fs.readFile('./img/jackiechanwhat.jpg', function(err, data){
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                    msg:  `Giphy does not allow one to query with hashtags.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                    msg:  `Search query-> ${mod}`,
                    color: `red`
                },{ 
                    action: 'renderStaticImage',
                    date:   now.format("HH:mm:ss"),
                    name:   (socket.name || SOCKET_CONNECTIONS.indexOf(socket)), 
                    image:  data.toString("base64"),
                }]
            };
            socket.emit('addToChat', send);
        });
        return;
    }
    let link = `http://api.giphy.com/v1/gifs/search?q=${mod}&api_key=${giphyapikey}&limit=1`;
    request.get(link, function (error, response, body) {
        let ret = JSON.parse(body);
        if (error || !ret.data){
            //giphy is down
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                    msg:  `Giphy is having issues.`,
                    color: `red`
                }]
            };

            socket.emit('addToChat', send);
            return;
        }
        // let {data: collections} = ret;
        // would assign a new array named as 'collections' with a value of ret.data

        ret = ret.data[0];
        if(ret){
            ret = ret.images.original.url;
            send = {
                chatmessages: [{
                    action: 'renderImage',
                    date: now.format("HH:mm:ss"),
                    name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                    link:  ret,
                    color: `red`
                }]
            };
            for (let i = 0; i < SOCKET_CONNECTIONS.length; i++) {
                SOCKET_CONNECTIONS[i].emit('addToChat', send);
            }
        } else {
            //giphy is up, but no images came back or query was shit
            //static file send
            fs.readFile('./img/sadpuppy.jpg', function(err, data){
                send = {
                    chatmessages: [{
                        action: 'renderText',
                        date: now.format("HH:mm:ss"),
                        name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                        msg:  `Giphy failed to return anything for search->'${mod}'`,
                        color: `red`
                    },{ 
                        action: 'renderText',
                        date: now.format("HH:mm:ss"),
                        name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                        msg:  `Sorry about that, here's a sad puppy instead:`,
                        color: `red`
                    },{ 
                        action: 'renderStaticImage',
                        date:   now.format("HH:mm:ss"),
                        name:   (socket.name || SOCKET_CONNECTIONS.indexOf(socket)), 
                        image:  data.toString("base64"),
                        color: `red`
                    }]
                };
                socket.emit('addToChat', send);
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