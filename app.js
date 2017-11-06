// app.js
var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));  

app.get('/', function(req, res,next){
    res.sendFile(__dirname + '/public/game.html');
});

var players = [];

io.on('connection', function(client) {  


	client.on('usernameCheck', function(username){
		var usernames = Object.keys(players);

		if(!(usernames.indexOf(username)+1)){
			players[username] = {};
			client.emit('usernameResponse', true);
			this.username = username;
		}
		else client.emit('usernameResponse', false);
	});


	client.on('disconnect', function(){
		client.broadcast.emit('chatMessage', this.username, ' has left the game');
		client.broadcast.emit('deletePlayer', this.username);
		delete players[this.username];
	});


	client.on('join', function() {//When the client joins, they send us a message
		//We'll give this new player info about everyone who's already in the game.
		for(var player in players){
			if(player == this.username)continue;
			client.emit('newPlayer', player);
		}
		//We'll tell everyone that a new player has joined
	    client.emit('chatMessage', 'Server', 'You have joined the game');
        client.broadcast.emit('chatMessage', 'Server', this.username + " has joined the game.");
        //Then tell all clients to make a new slot for him.
        client.broadcast.emit('newPlayer', this.username);
	});


	client.on('movementUpdate', function(data){
		//this.movementStats = data;
		client.broadcast.emit('movementUpdate', this.username, data);
	});

	client.on('swingUpdate', function(x, y, rotation){
		client.broadcast.emit('swingUpdate', this.username, x, y, rotation);
	});

	client.on('healthUpdate', function(health, dealtBy){
		if(health <= 0){
			client.emit('chatMessage', 'Server', "You were bested by " + dealtBy + "!");
			client.broadcast.emit('chatMessage', 'Server', this.username + " was bested by " + dealtBy + "!");
		}
		client.broadcast.emit('healthUpdate', this.username, health);
	});

	client.on('launchAttack', function(target, weapon, attackStats){
		client.broadcast.emit('launchAttack', this.username, weapon, target, attackStats);
	});

	client.on('requestAttack', function(attacker, attackStats){
		client.broadcast.emit('requestAttack', this.username, attacker, attackStats);
	});


	client.on('messages', function(data) {//If we get a message, it comes with some data
        client.emit('chatMessage', this.username, data);//Send message back to the guy who sent it
        client.broadcast.emit('chatMessage', this.username, data);//Send message back to everyone else
    });


});

server.listen(4200);  