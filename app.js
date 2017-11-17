var app = require('express')();
var server = require('http').Server(app);
var moment = require('moment');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
server.listen(80);
var io = require('socket.io')(server);
var SOCKET_CONNECTIONS = [];
io.sockets.on('connection', function (socket) {
//ONCONNECTION
    var start = new moment();
    SOCKET_CONNECTIONS.push(socket);
    for (let i = 0; i < SOCKET_CONNECTIONS.length; i++){
        if (SOCKET_CONNECTIONS[i] == socket)
            continue;
        SOCKET_CONNECTIONS[i].emit('addToChat', {
            date: start.format("HH:mm:ss"),
            name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
            msg:  'User ' + SOCKET_CONNECTIONS.indexOf(socket) + ' has connected.',
            color: socket.color
        });
        SOCKET_CONNECTIONS[i].emit('updateUsers', getNames(SOCKET_CONNECTIONS));
    }
    socket.emit('addToChat', {
        date: start.format("HH:mm:ss"),
        name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
        msg:  'User ' + SOCKET_CONNECTIONS.indexOf(socket) + ' has connected.',
        color: socket.color
    });
    socket.emit('updateUsers', getNames(SOCKET_CONNECTIONS));
//EVENTS
    socket.on('disconnect', function(){
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
    });
    socket.on('chatMsg', function (message) {   
        var now = new moment(); 	
        if (message.indexOf('<') > -1)
            message = message.replace(new RegExp(/</, 'g'), '&lt');
        var container = message.split(' ');
        for (var i=0; i<container.length; i++){
            if ((container[i].substr(0, 8)) == 'https://' || (container[i].substr(0, 7)) == 'http://'){
                var ext = container[i].substr(container[i].length-3, 3);
                if (ext == 'gif' || ext == 'jpg' || ext == 'png'){
                    container[i] = '<img src="'+container[i]+'" target="_blank" style="width: auto; max-height: 300px; max-width: 300px;">';
                } else {
                    container[i] = '<a href="'+container[i]+'" target="_blank">'+container[i]+'</a>';
                }
            }
        }
        message = container.join(' ');
        for (var i = 0; i < SOCKET_CONNECTIONS.length; i++) {
            SOCKET_CONNECTIONS[i].emit('addToChat', {
                date: now.format("HH:mm:ss"),
                name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                msg:  message, 
                color: socket.color
            });
        }
    });
    socket.on('command', function(message){
        var now = new moment();
        if (message.indexOf('<') > -1){
            message = message.replace(new RegExp(/</, 'g'), '&lt');
        }
        var command = message.substr(0, message.indexOf(' ')) || message;
        var mod = message.substr(command.length);
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
        } else {
            socket.emit('addToChat', {
                date: now.format("HH:mm:ss"),
                name: (socket.name || SOCKET_CONNECTIONS.indexOf(socket)),
                msg: 'Unknown command: '+command,
                color: 'red'
            });
        }
    });
});

//UTILITY OR REFACTORING
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