const express = require('express');
const app = express();
const server = require('http').Server(app);
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const request = require('request');
const io = require('socket.io')(server);
const linkifyHtml = require('linkifyjs/html');
const isImage = require('is-image');
const port = 80;
const youtubenode = require('youtube-node');
const youtube = new youtubenode();
const apiKeys = require('./apiKeys');
let keys = {};
// should really store api keys in .env.
// right now, api keys are read in asynchronously and may not be available at time of need
['youtube', 'giphy'].forEach((path) => {
    apiKeys.getApiKey(path)
        .then(key => keys[path] = key)
        .catch(err => console.log(err))
});

app.get('/', (req, res) => res.sendFile(`${__dirname}/client/index.html`));

server.listen(port);
console.log(`Listening on port: ${port}`);

let SOCKET_CONNECTIONS = [];
//socket: object
//description: consider this as a looping system, since sockets are persistant,
//the contents inside are always being evaluated.  this is the main loop of the program.
io.sockets.on('connection', (socket) => {
    init(socket);
    socket.on('disconnect', () => disconnects(socket));
    socket.on('chatMsg', (msg) => chatMsg(socket, msg));
    socket.on('istyping', (bools) => istyping(socket, bools));
});

//socket: object
//returns: void
//description: static method that only occurs once per connection to server is establish
function init(socket){
    SOCKET_CONNECTIONS.push(socket);
    let send = {
        chatmessages: [{
            action: 'renderText',
            date:  moment().format("HH:mm:ss"),
            name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
<<<<<<< HEAD
            msg:  `User ${address} has connected.`,
            color: socket.color,
            window: 0
=======
            msg:  `User ${socket.request.connection.remoteAddress} has connected.`,
            color: socket.color
>>>>>>> 787e61a5f085af524d6e367c0a590b3043f8cac5
        }]
    };
    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++){
        SOCKET_CONNECTIONS[i].emit('addToChat', send);
        SOCKET_CONNECTIONS[i].emit('updateUsers', getNames(SOCKET_CONNECTIONS));
    }
}

const getUsersTyping = () => {
    return SOCKET_CONNECTIONS.reduce((typers, connection) => {
        if (connection.ischatting) {
            typers.push(connection.name || SOCKET_CONNECTIONS.indexOf(connection))
        }

        return typers;
    }, []);
};

//socket: object
//returns: void
//description: events that occur after a user disconnects from the server
function disconnects(socket){
    let temp; //storing disconnected user
    let send = {
        chatmessages: [{
            action: 'renderText',
            date: moment().format("HH:mm:ss"),
            name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
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
        SOCKET_CONNECTIONS[j].emit('ischattinglist', getUsersTyping());
    }
}

function istyping(socket, bools){
    socket.ischatting = !!bools;
    let ret = getUsersTyping();
    for (var i=0; i<SOCKET_CONNECTIONS.length; i++){
        SOCKET_CONNECTIONS[i].emit('ischattinglist', ret);
    }
}

//socket: object
//msg: object
//returns: void
function chatMsg(socket, msg){
    const now = new moment();
    var id = msg.id;
    msg = msg.msg;
    console.log(id);
    if (msg.indexOf('<') > -1)
        msg = msg.replace(new RegExp(/</, 'g'), '&lt');
    if (msg.substr(0, 1) == '/'){
        command(socket, msg);
        return;
    }

    let act = `renderText`;
    if (isImage(msg)){
        act = `renderImage`;
    } else {
        msg = linkifyHtml(msg, {
            defaultProtocol: `https`,
        });
    }

    let send = {
        chatmessages: [{
            action: act,
            date: now.format("HH:mm:ss"),
            name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
            msg:  msg,
            color: socket.color,
            window: id
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
                    name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                    msg:  mod,
                    color: socket.color
                }]
            };
            socket.emit('addToChat', send);
            break;
        case '/color':
            socket.color = mod;
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: ``,
                    msg:  `Your color is now <span style="color: ${mod};">${mod}</span>.`,
                    color: `black`
                }]
            }
            socket.emit('addToChat', send);
            socket.emit('changeInputFontColor', socket.color);
            break;
        case '/gif':
            giphyrequest(socket, mod);
            break;
        case '/help':
            commandlist(socket, mod);
            break;
        case '/?':
            commandlist(socket, mod);
            break;
        case '/name':
            changename(socket, mod);
            break;
        case '/theme':
            if (mod == 'dark')
                mod = -100;
            else if (mod == 'light')
                mod = 100
            else if (mod == 'off')
                mod = 'off'
            else mod = 0;
            socket.theme = mod;
            socket.emit('changeTheme', socket.theme);
            break;
        case '/vid':
            youtuberequest(socket, mod);
            break;
        case '/video':
            youtuberequest(socket, mod);
            break;
        case '/youtube':
            youtuberequest(socket, mod);
            break;
        case '/yt':
            youtuberequest(socket, mod);
            break;
        default:
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                    msg:  `Unknown command: ${command}`,
                    color: `red`
                }]
            };
            socket.emit('addToChat', send);
    }
}

//socket: object
//mod: string
//description: part of command lib that will fetch mod from googlesapi
function youtuberequest(socket, mod){
    const now = new moment();
    let send;
    if (!apikeys.youtube){
        send = {
            chatmessages: [{
                action: 'renderText',
                date: now.format("HH:mm:ss"),
                name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                msg:  `Server not configured for that command yet.`,
                color: `red`
            }]
        };
        socket.emit('addToChat', send);
        return;
    }
    youtube.search(mod, 1, function(error, result){
        if(error){
            console.log(error);
            return;
        }
        if (result.items.length && result.items[0].id.videoId){
            send = {
                chatmessages: [{
                    action: 'renderVideo',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                    msg:  result.items[0].id.videoId,
                }]
            };
        } else {
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                    msg:  `Youtube failed. This can happen easily if you match a channel owner's name.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                    msg:  `Search query->'${mod}'.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                    msg:  `Try refining your search pattern with more text.`,
                    color: `red`
                }]
            };
            socket.emit('addToChat', send);
            return;
        }
        for (let i = 0; i < SOCKET_CONNECTIONS.length; i++) {
            SOCKET_CONNECTIONS[i].emit('addToChat', send);
        }
    });
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
                name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
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
                name: ``,
                msg:  `<b>${oldname}</b> is now known as: <b>${socket.name}</b>`,
                color: `white`
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
    if (!apikeys.giphy){
        send = {
            chatmessages: [{
                action: 'renderText',
                date: now.format("HH:mm:ss"),
                name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                msg:  `Server not configured for that command yet.`,
                color: `red`
            }]
        };
        socket.emit('addToChat', send);
        return;
    }
    if (mod.indexOf('#') > -1){
        fs.readFile('./img/jackiechanwhat.jpg', function(err, data){
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                    msg:  `Giphy does not allow one to query with hashtags.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                    msg:  `Search query-> ${mod}`,
                    color: `red`
                },{
                    action: 'renderStaticImage',
                    date:   ``,
                    name:   ``,
                    image:  data.toString("base64"),
                }]
            };
            socket.emit('addToChat', send);
        });
        return;
    }
    let link = `http://api.giphy.com/v1/gifs/search?q=${mod}&api_key=${apikeys.giphy}&limit=1`;
    request.get(link, function (error, response, body) {
        let ret = JSON.parse(body);
        if (error || !ret.data){
            //giphy is down
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                    msg:  `Giphy is having issues or is down apparently.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                    msg:  `Try again later.`,
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
                    name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                    msg:  ret,
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
                        name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                        msg:  `Giphy failed to return anything!`,
                        color: `red`
                    },{
                        action: 'renderText',
                        date: now.format("HH:mm:ss"),
                        name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                        msg:  `Search query->'${mod}'`,
                        color: `red`
                    },{
                        action: 'renderText',
                        date: now.format("HH:mm:ss"),
                        name: `${socket.name || SOCKET_CONNECTIONS.indexOf(socket)}:`,
                        msg:  `Sorry about that, here's a sad puppy instead:`,
                        color: `red`
                    },{
                        action: 'renderStaticImage',
                        date:   ``,
                        name:   ``,
                        image:  data.toString("base64"),
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
            temp = String(i);
        ret.push(temp)
    }
    return ret;
}

//socket: object
//mod: string
//description: part of the command lib that retrieves all commands from the current build
function commandlist(socket, mod){
    //if i had a db, it woudln't be this way, but since i don't want that added layer of bs, this will suffice
    let ret = `<br><b>COMMANDS:</b><br>`;
    ret += `<br><b>&uarr; &darr;</b> with input selected cycles through past posted messages.`;
    let commanddescriptions = {
        code:   `<i>codeblock</i>                           -- Wraps <i>codeblock</i> in a codeblock.`,
        color:  `<i>color</i>                               -- Changes color of your broadcasted messages.`,
        gif:    `<i>search</i>                              -- Retrieves first result from giphy <i>search</i>.`,
        help:   `<b>/?</b> <i>command</i>                   -- Information about singular <i>command</i>. With no command specified, retrieves entire list.`,
        name:   `<i>identity</i>                            -- Changes your current identity to <i>identity</i>.`,
        theme:  `<i>dark | light | off |</i>                -- Various theme options. Arguments are optional (will gen randomly).`,
        yt:     `<b>/vid /video /youtube</b> <i>search</i>   -- Retrieves first result from a youtube <i>search</i>.`
    }
    if (mod){
        if(mod in commanddescriptions)
            ret = commanddescriptions[mod];
        else
            mod = 0;
    }
    if (!mod){
        for (let i in commanddescriptions){
            ret += `<br><b>/${i}</b> ${commanddescriptions[i]}`;
        }
    }

    let send = {
        chatmessages: [{
            action: 'renderText',
            textshadow: '2px 2px 8px #FF0000',
            date: '',
            name: '',
            msg: ret,
        },]
    };
    socket.emit('addToChat', send);
}