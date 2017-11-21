var app = require('express')();
var server = require('http').Server(app);
var moment = require('moment');
var request = require('request');
var io = require('socket.io')(server);
var giphyapikey = 'mIXP4ZfFAYQ1feYwdQhvbJOsvmwY3qB2';

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
    var now = new moment();
    if (msg.indexOf('<') > -1)
        msg = msg.replace(new RegExp(/</, 'g'), '&lt');
    if (msg.substr(0, 1) == '/'){
        command(socket, msg);
        return;
    }
    var container = msg.split(' ');
    for (let i=0; i<container.length; i++){
        if ((container[i].substr(0, 8)) == 'https://' || (container[i].substr(0, 7)) == 'http://'){
            var ext = container[i].substr(container[i].length-3, 3);
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
    var now = new moment();
    var command = msg.substr(0, msg.indexOf(' ')) || msg;
    var mod = msg.substr(command.length+1);
    switch(command){     
        case '/color':
            socket.color = mod;
            socket.emit('changeInputFontColor', socket.color);
            break;
        case '/gif':
            var link = `http://api.giphy.com/v1/gifs/search?q=${mod}&api_key=${giphyapikey}&limit=1`;
            request(link, function (error, response, body) {
                var ret = JSON.parse(body).data[0];
                if(ret){
                    var ret = ret.images.original.url;
                    chatMsg(socket, ret);
                    for (let i =0; i<SOCKET_CONNECTIONS.length; i++){
                        SOCKET_CONNECTIONS[i].emit('addToChat', {
                            date: now.format("HH:mm:ss"),
                            name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                            msg: `<a href="${ret}" target="_blank">${ret}</a>`, 
                            color: socket.color
                        });
                    }
                } else {
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
                    var sadpuppy = `<img src="http://www.lovethispic.com/uploaded_images/274129-Sad-Puppy.jpg" style="width: auto; max-height: 300px; max-width: 300px;border-radius: 10px;"></img>`;
                    socket.emit('addToChat', { 
                        date: now.format("HH:mm:ss"),
                        name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                        msg:  sadpuppy,
                    });
                }
            });
            break;
        case '/name':
            if(mod.length > 20){
                socket.emit('addToChat', { 
                    date: now.format("HH:mm:ss"),
                    name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                    msg:  'Use <20 characters for name plz.',
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

//arg: array
//returns: array
//description: basically how to get the names of all connected clients 
//even if they are still an array index
function getNames(arg){
    var ret =[];
    for(let i=0; i<arg.length; i++){
        if(arg[i].name)
            temp = arg[i].name.trim();
        else
            temp = i;
        ret.push(temp)
    }
    return ret;
}