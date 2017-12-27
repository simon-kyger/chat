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
const apiKeys = require('./apiKeys');
const logger = require('morgan');
const ytsongs = require('./devplaylists/ytsongs.json');

let keys = {};


// should really store api keys in .env.
['youtube', 'giphy'].forEach((path) => {
    apiKeys.getApiKey(path)
        .then(key => {
            keys[path] = key;
        })
        .catch(err => console.log(err))
});

if(process.env.NODE_ENV=== 'simon'){
  app.use('/', express.static(path.join(__dirname, 'client')));
} else{
  app.use(logger('dev'));
  app.use('/dist', express.static('dist'));
  app.get('/', (req, res) =>  res.sendFile(path.join(__dirname,"./dist/index.html")))
}

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
    socket.ignore = [];
    gnameincrementer++;
    console.log(`${socket.request.connection.remoteAddress} has connected.`);
    let send = {
        chatmessages: [{
            action: 'renderText',
            date:  `[${moment().format("HH:mm:ss")}]`,
            name: ``,
            msg:  `[${socket.name}] has connected.`,
            color: socket.color
        }],
        curtab: 'Main'
    };
    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++){
        SOCKET_CONNECTIONS[i].emit('addToChat', send);
        SOCKET_CONNECTIONS[i].emit('updateUsers', getNames(SOCKET_CONNECTIONS));
    }
    //for live sending of new stuff, this can be jerry rigged later
    send.chatmessages[0].msg = `Check out this youtube video one of our devs likes:`
    socket.emit('addToChat', send);

    youtuberequest(socket, ytfavorites(), 'Main', true);
}

//socket: object
//returns: void
//description: events that occur after a user disconnects from the server
function disconnects(socket){
    let temp; //storing disconnected user
    let send = {
        chatmessages: [{
            action: 'renderText',
            date:  `[${moment().format("HH:mm:ss")}]`,
            name: ``,
            msg:  `[${socket.name}] has disconnected.`,
            color: socket.color
        }],
        curtab: 'Main'
    };
    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++){
        if(SOCKET_CONNECTIONS[i].id == socket.id){
            temp = i;
            continue;
        }
        SOCKET_CONNECTIONS[i].emit('addToChat', send);
    }
    console.log(`${socket.request.connection.remoteAddress} has disconnected.`);
    SOCKET_CONNECTIONS.splice(temp, 1);
    for (let j =0; j < SOCKET_CONNECTIONS.length; j++){
        SOCKET_CONNECTIONS[j].emit('removeTab', socket.name);
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

//this needs to handle private messages, currently its echoing all users even in pms
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
    if (msg.msg.indexOf('<') > -1)
        msg.msg = msg.msg.replace(new RegExp(/</, 'g'), '&lt');

    let send = {
        chatmessages: [{
            action: `renderText`,
            date:  `[${moment().format("HH:mm:ss")}]`,
            name: `[${socket.name}]:`,
            msg:  msg.msg,
            color: socket.color,
        }],
    };

    if (msg.msg.substr(0, 32) == `https://www.youtube.com/watch?v=`){
        send.chatmessages[0].action = `renderVideo`;
        send.chatmessages[0].msg = msg.msg.substr(32);
    } else if (msg.msg.substr(0, 17) == `https://youtu.be/`){
        send.chatmessages[0].action = `renderVideo`;
        send.chatmessages[0].msg = msg.msg.substr(17);
    } else if (isImage(msg.msg)){
        send.chatmessages[0].action = `renderImage`;
    } else if (Object.keys(msg.blob).length){
        send.chatmessages[0].action = `renderBlob`;
        send.chatmessages[0].blob = msg.blob;
    } else {
        send.chatmessages[0].msg = linkifyHtml(msg.msg, {
            defaultProtocol: `https`,
        });
    }
    console.log(send.chatmessages[0].action);

    for (let i = 0; i<SOCKET_CONNECTIONS.length; i++){
        if (SOCKET_CONNECTIONS[i].name == msg.curtab){
            let reciever = SOCKET_CONNECTIONS[i];
            for (let j=0; j<reciever.ignore.length; j++){
                if (reciever.ignore[j] == socket.name){
                    send.chatmessages[0].msg = `User ${reciever.name} is ignoring you.`;
                    send.curtab = msg.curtab || `Main`;
                    send.chatmessages[0].color = `red`;
                    socket.emit('addToChat', send)
                    return;
                }
            }
        }
    }
    if (msg.msg.substr(0, 1) == '/'){
        command(socket, msg.msg, msg.curtab);
        return;
    }

    if (msg.curtab !== 'Main'){
        for (let i = 0; i<SOCKET_CONNECTIONS.length; i++){
            if (SOCKET_CONNECTIONS[i].name == msg.curtab){
                let reciever = SOCKET_CONNECTIONS[i];
                send.curtab = socket.name;
                reciever.emit('addToChat', send);
                send.curtab = msg.curtab;
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
function command(socket, msg, curtab){
    //match on first space or carriage return and get everything before that
    let command = msg.split(/[\n\r\s]+/g)[0];
    //get first char after command
    let mod = msg.substr(command.length+1).trim();
    let send;
    switch(command){
        case '/code':
            codeblock(socket, mod, curtab);
            break;
        case '/color':
            changecolor(socket, mod, curtab);
            break;
        case '/gif':
            giphyrequest(socket, mod, curtab);
            break;
        case '/giphy':
            giphyrequest(socket, mod, curtab);
            break;
        case '/help':
            commandlist(socket, mod, curtab);
            break;
        case '/?':
            commandlist(socket, mod, curtab);
            break;
        case '/ignore':
            ignoreuser(socket, mod, curtab);
            break;
        case '/name':
            changename(socket, mod, curtab);
            break;
        case '/price':
            price(socket, mod, curtab);
            break;
        case '/reddit':
            redditrequest(socket, mod, curtab);
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
            youtuberequest(socket, mod, curtab);
            break;
        case '/video':
            youtuberequest(socket, mod, curtab);
            break;
        case '/youtube':
            youtuberequest(socket, mod, curtab);
            break;
        case '/yt':
            youtuberequest(socket, mod, curtab);
            break;
        default:
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date:  `[${moment().format("HH:mm:ss")}]`,
                    name: `[${socket.name}]:`,
                    msg:  `Unknown command: ${command}`,
                    color: `red`,
                }],
                curtab: curtab
            };
            socket.emit('addToChat', send);
    }
}

function ignoreuser(socket, mod, curtab){
    let send = {
        chatmessages: [{
            action: 'renderText',
            date:  `[${moment().format("HH:mm:ss")}]`,
            name: ``,
            msg:  `You are now ignoring `,
            color: `red`
        }],
        curtab: curtab
    };
    for(let i=0; i<socket.ignore.length; i++){
        send.chatmessages[0].msg += socket.ignore[i];
    }

    //returning current ignore list if not ignoring anyone right now.
    if (mod.length<1){
        socket.emit(`addToChat`, send);
        return;
    }

    //check if mod is an actual user
    let temp;
    for (let i=0; i<SOCKET_CONNECTIONS.length; i++){
        if (SOCKET_CONNECTIONS[i].name == mod){
            temp = SOCKET_CONNECTIONS[i];
        }
    }
    if (!temp){
        send.chatmessages[0].msg = `Could not find user by name of ${mod}`;
        socket.emit(`addToChat`, send);
        return;
    }
    //check if you're trying yourself derp
    if (temp.name == socket.name){
        send.chatmessages[0].msg = `So you're trying to ignore yourself.  That's cool.  No.`;
        socket.emit(`addToChat`, send);
        return;
    }

    //check if user already is in the list and remove it if they are
    for (let i=0; i<socket.ignore.length; i++){
        if (socket.ignore[i] == mod){
            socket.ignore.splice(i, 1);
            send.chatmessages[0].msg = `${socket.name} is no longer ignoring ${mod}`;
            socket.emit('addToChat', send);
            temp.emit('addToChat', send);
            return;
        }
    }

    //performing the ignore
    socket.ignore.push(mod);
    send.chatmessages[0].msg += ` ${mod}`;
    socket.emit('addToChat', send);
    send.chatmessages[0].msg = `User ${socket.name} is now ignoring you.`;
    temp.emit('addToChat', send)
}

function codeblock(socket, mod, curtab){
    let send = {
        chatmessages: [{
            action: 'renderCodeBlock',
            date:  `[${moment().format("HH:mm:ss")}]`,
            name: `[${socket.name}]:`,
            msg:  mod,
            color: socket.color
        }],
        curtab: curtab
    };
    if (!mod){
        send.chatmessages[0].action = 'renderText';
        send.chatmessages[0].msg = `Enter some code after the mod. Example: /code function() { console.log('hi there');}`;
        send.chatmessages[0].color = `red`;
        socket.emit(`addToChat`, send);
        return;
    }
    if (curtab !== 'Main'){
        for (let i = 0; i<SOCKET_CONNECTIONS.length; i++){
            if (SOCKET_CONNECTIONS[i].name == curtab){
                send.curtab = socket.name;
                SOCKET_CONNECTIONS[i].emit('addToChat', send);
                send.curtab = curtab;
                socket.emit('addToChat', send);
                return;
            }
        }
    }
    for (let i = 0; i<SOCKET_CONNECTIONS.length; i++){
        SOCKET_CONNECTIONS[i].emit('addToChat', send);
    }
}

function changecolor(socket, mod, curtab){
    socket.color = mod;
    let send = {
        chatmessages: [{
            action: 'renderText',
            date:  `[${moment().format("HH:mm:ss")}]`,
            name: ``,
            msg:  `${socket.name}'s color is now: <span style="color: ${mod};">${mod}</span>.`,
            color: `red`
        }],
        curtab: curtab
    }
    if (curtab !== 'Main'){
        for (let i = 0; i<SOCKET_CONNECTIONS.length; i++){
            if (SOCKET_CONNECTIONS[i].name == curtab){
                send.curtab = socket.name;
                SOCKET_CONNECTIONS[i].emit('addToChat', send);
                send.curtab = curtab;
                socket.emit('addToChat', send);
                return;
            }
        }
    }
    for (let i = 0; i<SOCKET_CONNECTIONS.length; i++){
        SOCKET_CONNECTIONS[i].emit('addToChat', send);
    }
    socket.emit('changeInputFontColor', socket.color);
}

function price(socket, mod, curtab, shenanigans){
    let send = {
        chatmessages: [{
            action: 'renderText',
            date:  `[${moment().format("HH:mm:ss")}]`,
            name: `[${socket.name}]:`,
        }],
        curtab: curtab
    };
    mod = mod.toUpperCase();
    let link = `https://min-api.cryptocompare.com/data/price?fsym=${mod}&tsyms=USD`;
    request.get(link, function(error, response, body){
        if (error){
            console.log(error)
            return;
        }
        body = JSON.parse(body);
        if (body.USD){
            send.chatmessages[0].msg = `Price of ${mod}: <b>$${body.USD}</b>`;
        } else {
            send.chatmessages[0].msg = `Unable to retrieve ->'${mod}'. Example usage: /price BTC.`;
            send.chatmessages[0].color = `red`;
        }
        if (curtab !== 'Main'){
            for (let i = 0; i<SOCKET_CONNECTIONS.length; i++){
                if (SOCKET_CONNECTIONS[i].name == curtab){
                    send.curtab = socket.name;
                    SOCKET_CONNECTIONS[i].emit('addToChat', send);
                    send.curtab = curtab;
                    socket.emit('addToChat', send);
                    return;
                }
            }
        }

        for (let i = 0; i < SOCKET_CONNECTIONS.length; i++) {
            SOCKET_CONNECTIONS[i].emit('addToChat', send);
        }
    });
}

//socket: object
//mod: string
//description: part of command lib that will fetch mod from googlesapi
function youtuberequest(socket, mod, curtab, shenanigans){
    let send;
    if (!keys.youtube){
        send = {
            chatmessages: [{
                action: 'renderText',
                date:  `[${moment().format("HH:mm:ss")}]`,
                name: `[${socket.name}]:`,
                msg:  `Server not configured for that command.`,
                color: `red`
            }],
            curtab: curtab
        };
        socket.emit('addToChat', send);
        return;
    }
    let link=`https://www.googleapis.com/youtube/v3/search/?q=${mod}&maxResults=1&part=snippet&key=${keys.youtube}`
    request.get(link, function(error, response, body){
        if(error){
            console.log(error);
            return;
        }
        body = JSON.parse(body);
        if (body.items[0] && body.items[0].id.videoId){
            send = {
                chatmessages: [{
                    action: 'renderVideo',
                    date:  `[${moment().format("HH:mm:ss")}]`,
                    name: `[${socket.name}]:`,
                    msg:  body.items[0].id.videoId,
                }],
                curtab: curtab
            };
        } else {
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date:  `[${moment().format("HH:mm:ss")}]`,
                    name: ``,
                    msg:  `Youtube failed. This can happen easily if you match a channel owner's name.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date:  `[${moment().format("HH:mm:ss")}]`,
                    name: ``,
                    msg:  `Search query->'${mod}'.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date:  `[${moment().format("HH:mm:ss")}]`,
                    name: ``,
                    msg:  `Try refining your search pattern with more text.`,
                    color: `red`
                }],
                curtab: curtab
            };
            socket.emit('addToChat', send);
            return;
        }
        if (curtab !== 'Main'){
            for (let i = 0; i<SOCKET_CONNECTIONS.length; i++){
                if (SOCKET_CONNECTIONS[i].name == curtab){
                    send.curtab = socket.name;
                    SOCKET_CONNECTIONS[i].emit('addToChat', send);
                    send.curtab = curtab;
                    socket.emit('addToChat', send);
                    return;
                }
            }
        }
        if (shenanigans){
            send.chatmessages[0].name = ``;
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
function changename(socket, mod, curtab){
    let send;
    let allnames = getNames(SOCKET_CONNECTIONS);
    for (let i = 0; i<allnames.length; i++){
        if (allnames[i] == mod){
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date:  `[${moment().format("HH:mm:ss")}]`,
                    name: ``,
                    msg:  `Name '${mod}' is already in use.`,
                    color: 'red'
                }],
                curtab: curtab
            };
            socket.emit('addToChat', send);
            return;
        }
    }
    if(mod.length > 20 || mod.length < 1){
        send = {
            chatmessages: [{
                action: 'renderText',
                date:  `[${moment().format("HH:mm:ss")}]`,
                name: ``,
                msg:  `Use 1-20 characters for your name plz`,
                color: `red`
            }],
            curtab: curtab
        };
        socket.emit('addToChat', send);
        return;
    } else {
        let oldname = socket.name;
        socket.name = mod;
        send = {
            chatmessages: [{
                action: 'renderText',
                date:  `[${moment().format("HH:mm:ss")}]`,
                name: ``,
                msg:  `<b>[${oldname}]</b> is now known as: <b>[${socket.name}]</b>`,
                color: `red`
            }],
            curtab: curtab
        };
        if (curtab !== 'Main'){
            for (let i = 0; i<SOCKET_CONNECTIONS.length; i++){
                if (SOCKET_CONNECTIONS[i].name == curtab){
                    send.curtab = socket.name;
                    SOCKET_CONNECTIONS[i].emit('removeTab', oldname);
                    SOCKET_CONNECTIONS[i].emit('addToChat', send);
                    send.curtab = curtab;
                    socket.emit('addToChat', send);
                }
            }
        }
        send.curtab = 'Main';
        for (let i = 0; i < SOCKET_CONNECTIONS.length; i++) {
            SOCKET_CONNECTIONS[i].emit('addToChat', send);
            SOCKET_CONNECTIONS[i].emit('updateUsers', getNames(SOCKET_CONNECTIONS));
        }
    }
}

//socket: object
//mod: string
//description: part of command lib that will fetch mod from giphy.com
function giphyrequest(socket, mod, curtab, shenanigans){
    let send;
    if (!keys.giphy){
        send = {
            chatmessages: [{
                action: 'renderText',
                date:  `[${moment().format("HH:mm:ss")}]`,
                name: `[${socket.name}]:`,
                msg:  `Server not configured for that command.`,
                color: `red`
            }],
            curtab: curtab
        };
        socket.emit('addToChat', send);
        return;
    }
    if (mod.indexOf('#') > -1){
        fs.readFile('./img/jackiechanwhat.jpg', function(err, data){
            send = {
                chatmessages: [{
                    action: 'renderText',
                    date:  `[${moment().format("HH:mm:ss")}]`,
                    name: ``,
                    msg:  `Giphy does not allow one to query with hashtags.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date:  `[${moment().format("HH:mm:ss")}]`,
                    name: ``,
                    msg:  `Search query-> ${mod}`,
                    color: `red`
                },{
                    action: 'renderStaticImage',
                    date:   ``,
                    name:   ``,
                    image:  data.toString("base64"),
                }],
                curtab: curtab
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
                    date:  `[${moment().format("HH:mm:ss")}]`,
                    name: ``,
                    msg:  `Giphy is having issues or is down apparently.`,
                    color: `red`
                },{
                    action: 'renderText',
                    date:  `[${moment().format("HH:mm:ss")}]`,
                    name: ``,
                    msg:  `Try again later.`,
                    color: `red`
                }],
                curtab: curtab
            };

            socket.emit('addToChat', send);
            return;
        }
        // let {data: collections} = ret;
        // would assign a new array named as 'collections' with a value of ret.data

        ret = ret.data[0];
        if(!ret){
            //giphy is up, but no images came back or query was shit
            //static file send
            fs.readFile('./img/sadpuppy.jpg', function(err, data){
                send = {
                    chatmessages: [{
                        action: 'renderText',
                        date:  `[${moment().format("HH:mm:ss")}]`,
                        name: ``,
                        msg:  `Giphy failed to return anything!`,
                        color: `red`
                    },{
                        action: 'renderText',
                        date:  `[${moment().format("HH:mm:ss")}]`,
                        name: ``,
                        msg:  `Search query->'${mod}'`,
                        color: `red`
                    },{
                        action: 'renderText',
                        date:  `[${moment().format("HH:mm:ss")}]`,
                        name: ``,
                        msg:  `Sorry about that, here's a sad puppy instead:`,
                        color: `red`
                    },{
                        action: 'renderStaticImage',
                        date:   ``,
                        name:   ``,
                        image:  data.toString("base64"),
                    }],
                    curtab: curtab
                };
                socket.emit('addToChat', send);
            });
        } else {
            ret = ret.images.original.url;
            send = {
                chatmessages: [{
                    action: 'renderImage',
                    date:  `[${moment().format("HH:mm:ss")}]`,
                    name: `[${socket.name}]:`,
                    msg:  ret,
                }],
                curtab: curtab
            };
            if (curtab !== 'Main'){
                for (let i = 0; i<SOCKET_CONNECTIONS.length; i++){
                    if (SOCKET_CONNECTIONS[i].name == curtab){
                        send.curtab = socket.name;
                        SOCKET_CONNECTIONS[i].emit('addToChat', send);
                        send.curtab = curtab;
                        socket.emit('addToChat', send);
                        return;
                    }
                }
            }
            if (shenanigans){
                send.chatmessages[0].name = ``;
                socket.emit('addToChat', send);
                return;
            }
            for (let i = 0; i < SOCKET_CONNECTIONS.length; i++) {
                SOCKET_CONNECTIONS[i].emit('addToChat', send);
            }
        }
    });
}

function redditrequest(socket, mod){
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
function commandlist(socket, mod, curtab){
    //if i had a db, it woudln't be this way, but since i don't want that added layer of bs, this will suffice
    let ret = `<br><b>COMMANDS:</b><br>`;
    ret += `<br>Optional Arguments are in brackets []<br>`;
    let commanddescriptions = {
        arrowkeys:  `<b>&uarr; &darr;</b>                       -> Cycles through past posted messages.`,
        code:       `<i>codeblock</i>                           -> Wraps <i>codeblock</i> in a codeblock.`,
        color:      `<i>color</i>                               -> Changes color of your broadcasted messages.`,
        gif:        `<b> /giphy </b> <i>search</i>              -> Retrieves first result from giphy <i>search</i>.`,
        help:       `<b>/?</b> <i>command</i>                   -> Information about singular <i>command</i>. With no command specified, retrieves entire list.`,
        ignore:     `[<i>user</i>]                              -> Retrieves all ignored users. Arguments will add users to ignored list.`,
        name:       `<i>identity</i>                            -> Changes your current identity to <i>identity</i>.`,
        price:      `<i>coinid</i>                              -> Retrieves cryptocoin price in USDollars of <i>coinid</i>.`,
        theme:      `[<i>dark | light | off |</i>]              -> Various theme options. Arguments are optional (will gen randomly).`,
        yt:         `<b>/vid /video /youtube</b> <i>search</i>  -> Retrieves first result from a youtube <i>search</i>.`
    }
    if (mod){
        if(mod in commanddescriptions)
            ret += `/<b>${mod}</b> ${commanddescriptions[mod]}`;
        else
            mod = 0;
    }
    if (!mod){
        for (let i in commanddescriptions){
            if (i == 'arrowkeys'){
                ret += `<br><b>${i}</b> ${commanddescriptions[i]}`;
                continue;
            }
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
        }],
        curtab: curtab
    };
    socket.emit('addToChat', send);
}

function ytfavorites(){
    return ytsongs[Math.floor(Math.random()*(ytsongs.length-1))];
}
