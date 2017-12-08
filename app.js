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
const config = require('config');
const port = config.get('port');
const youtubenode = require('youtube-node');
const youtube = new youtubenode();
const apiKeys = require('./apiKeys');
let keys = {};
// should really store api keys in .env.
['youtube', 'giphy'].forEach((path) => {
    apiKeys.getApiKey(path)
        .then(key => {
            keys[path] = key;
            if (path === 'youtube') youtube.setKey(key);
        })
        .catch(err => console.log(err))
});

// This serves the static assets directory from '/'
// will try to match resources specified after root ('/')
// against explicit resource handlers 
app.use('/', express.static(path.join(__dirname, 'client')));

server.listen(port);
console.log(`Listening on port: ${port}`);

let SOCKET_CONNECTIONS = [];
let gnameincrementer = 0;
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
    socket.name = gnameincrementer;
    gnameincrementer++;
    let send = {
        chatmessages: [{
            action: 'renderText',
            date:  moment().format("HH:mm:ss"),
            name: ``,
            msg:  `User ${socket.request.connection.remoteAddress} has connected.`,
            color: socket.color,
            curtab: 'Main'
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
    let temp; //storing disconnected user
    let send = {
        chatmessages: [{
            action: 'renderText',
            date: moment().format("HH:mm:ss"),
            name: socket.name,
            msg:  `User ${socket.name} has disconnected.`,
            color: socket.color,
            curtab: 'Main'
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

const getUsersTyping = () => {
    return SOCKET_CONNECTIONS.reduce((typers, connection) => {
        if (connection.ischatting) {
            typers.push(connection.name)
        }

        return typers;
    }, []);
};

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
    if (msg.msg.indexOf('<') > -1)
        msg.msg = msg.msg.replace(new RegExp(/</, 'g'), '&lt');
    if (msg.msg.substr(0, 1) == '/'){
        command(socket, msg.msg);
        return;
    }

    let act = `renderText`;
    if (isImage(msg.msg)){
        act = `renderImage`;
    } else if (msg.msg.substr(0, 23) == `https://www.youtube.com`){
        act = `renderVideoLink`;
    } else {
        msg.msg = linkifyHtml(msg.msg, {
            defaultProtocol: `https`,
        });
    }

    let send = {
        chatmessages: [{
            action: act,
            date: now.format("HH:mm:ss"),
            name: `${socket.name}:`,
            msg:  msg.msg,
            color: socket.color,
            curtab: msg.curtab,
            id: socket.name
        }]
    };

    if (msg.curtab !== 'Main'){
        for (let i = 0; i<SOCKET_CONNECTIONS.length; i++){
            if (SOCKET_CONNECTIONS[i].name == msg.curtab){
                SOCKET_CONNECTIONS[i].emit('addToChat', send);
                socket.emit('addToChat', send);
                return;
            }
        }
    }

    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++) {
        SOCKET_CONNECTIONS[i].emit('addToChat', send);
    }
}

function getIpOfName(name){
    for (let i=0; i<SOCKET_CONNECTIONS.length; i++){
        if (SOCKET_CONNECTIONS[i].name == name)
            return SOCKET_CONNECTIONS[i].request.connection.remoteAddress;
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
                    name: `${socket.name}:`,
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
        case '/reddit':
            redditrequest(socket, mod);
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
                    name: `${socket.name}:`,
                    msg:  `Unknown command: ${command}`,
                    color: `red`,
                    curtab: msg.curtab
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
    if (!keys.youtube){
        send = {
            chatmessages: [{
                action: 'renderText',
                date: now.format("HH:mm:ss"),
                name: `${socket.name}:`,
                msg:  `Server not configured for that command.`,
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
                    name: `${socket.name}:`,
                    msg:  result.items[0].id.videoId,
                }]
            };
        } else {
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name}:`,
                    msg:  `Youtube failed. This can happen easily if you match a channel owner's name.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name}:`,
                    msg:  `Search query->'${mod}'.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name}:`,
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
    let allnames = getNames(SOCKET_CONNECTIONS);
    for (let i = 0; i<allnames.length; i++){
        if (allnames[i] == mod){
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: ``,
                    msg:  `Name '${mod}' is already in use.`,
                    color: 'red'
                }]
            };
            socket.emit('addToChat', send);
            return;
        }
    }
    if(mod.length > 20 || mod.length < 1){
        send = {
            chatmessages: [{
                action: 'renderText',
                date: now.format("HH:mm:ss"),
                name: `${socket.name}:`,
                msg:  `Use 1-20 characters for your name plz`,
                color: socket.color
            }]
        };
        socket.emit('addToChat', send);
        return;
    } else {
        let oldname = socket.name;
        socket.name = mod;
        send = {
            chatmessages: [{
                action: 'renderText',
                date: now.format("HH:mm:ss"),
                name: ``,
                msg:  `<b>${oldname}</b> is now known as: <b>${socket.name}</b>`,
                color: socket.color
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
    if (!keys.giphy){
        send = {
            chatmessages: [{
                action: 'renderText',
                date: now.format("HH:mm:ss"),
                name: `${socket.name}:`,
                msg:  `Server not configured for that command.`,
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
                    name: ``,
                    msg:  `Giphy does not allow one to query with hashtags.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: ``,
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
    let link = `http://api.giphy.com/v1/gifs/search?q=${mod}&api_key=${keys.giphy}&limit=1`;
    request.get(link, function (error, response, body) {
        let ret = JSON.parse(body);
        if (error || !ret.data){
            //giphy is down
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name}:`,
                    msg:  `Giphy is having issues or is down apparently.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date: now.format("HH:mm:ss"),
                    name: `${socket.name}:`,
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
                    name: `${socket.name}:`,
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
                        name: `${socket.name}:`,
                        msg:  `Giphy failed to return anything!`,
                        color: `red`
                    },{
                        action: 'renderText',
                        date: now.format("HH:mm:ss"),
                        name: `${socket.name}:`,
                        msg:  `Search query->'${mod}'`,
                        color: `red`
                    },{
                        action: 'renderText',
                        date: now.format("HH:mm:ss"),
                        name: `${socket.name}:`,
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

function redditrequest(socket, mod){
    const now = new moment();
    let send;
    let link = `https://www.reddit.com/.json`;
    request.get(link, function (error, response, body) {
        let query = JSON.parse(body);
        let ret = query.data.children[0];
        console.log(ret);
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
            temp = arg[i].name;
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
