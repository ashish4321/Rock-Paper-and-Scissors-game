// app.js
var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/node_modules'));  

app.get('/', function(req, res,next){
    res.sendFile(__dirname + '/node_modules/game.html');
});

io.on('connection', function(client) {  
	console.log('Client connected...');//Start message

	client.on('join', function(data) {//When the client joins, they send us a message
	    client.emit('broad', 'You have joined the game');//This puts a message in the console of the person who just joined.
        client.broadcast.emit('broad', "Someone has joined the game.");//This will send the message to everyone else, too.
	});

	client.on('messages', function(data) {//If we get a message, it comes with some data
           client.emit('broad', data);//Send message back to the guy who sent it
           client.broadcast.emit('broad',data);//Send message back to everyone else
    });

});

server.listen(4200);  