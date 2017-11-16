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
var environment = [{
	type:'teleporter',
	x:0,
	y:0
}];


var trashLootTable = {
	//basic
	'rock':{
		rarity:60,
		quanity:[3, 10]
	},
	'paper':{
		rarity:60,
		quanity:[3, 10]
	},
	'scissors':{
		rarity:60,
		quanity:[3, 10]
	},
	//crafting misc.
	'soiled cloth':{
		rarity:40,
		quanity:[1, 2]
	},
	'cardboard':{
		rarity:80,
		quanity:[3, 5]
	},
	//crafting base materials
	'can':{
		rarity:65,
		quanity:[3, 5]
	},
	'magicked wax':{
		rarity:90,
		quanity:1
	},
	//base material manipulators
	'laser lighter':{
		rarity:5,
		quanity:1
	},
	'magical needle':{
		rarity:10,
		quanity:1
	},
	//crafting tier two craftable base materials
	'long metal pipe':{
		rarity:0.35,
		quanity:1
	},
	'short metal pipe':{
		rarity:1,
		quanity:1
	},
	'waxen frame':{
		rarity:0.05,
		quanity:1
	},
	'waxen tendrils':{
		rarity:2,
		quanity:1
	},
	//crafting tier two craftable ammunition
	'metal shard':{
		rarity:10,
		quanity:1
	},
	'metal ball':{
		rarity:10,
		quanity:1
	},
	'metal plate':{
		rarity:10,
		quanity:1
	},
	'waxen blade':{
		rarity:10,
		quanity:1
	},
	'waxen glob':{
		rarity:10,
		quanity:1
	},
	'waxen slab':{
		rarity:10,
		quanity:1
	},
	//crafting teir two findables
	'kinetic accelerator':{
		rarity:2.5,
		quanity:1
	},
	'tapped rune':{
		rarity:2.5,
		quanity:1
	},
	//crafting teir two weapons
	'popper':{//short pipe, KA
		rarity:0.25,
		quanity:1
	},
	'boomer':{//three short pipes, 2 KA
		rarity:0.1,
		quanity:1
	},
	'blaster':{//long pipe, KA
		rarity:0.1,
		quanity:1
	},
	'rifle':{//long pipe, 6 short pipes, 3 KA
		rarity:0.01,
		quanity:1
	},
	'scepter':{//three tendril, TR
		rarity:0.25,
		quanity:1
	},
	'loopshield':{//five tendril, TR
		rarity:0.1,
		quanity:1
	},
	'trident':{//tendril frame, three tendril, TR
		rarity:0.05,
		quanity:1
	},
	'launcher':{//tendril frame, seven tendril, 2 TR
		rarity:0.01,
		quanity:1
	}
}


function fillWithLootFromTable(array, lootTable){
	for(let lootItemIndex in lootTable){
		let lootItem = lootTable[lootItemIndex];

		if(Math.random()*100 < lootItem.rarity){
			
			if(lootItem.rarity.isArray){
				console.log(lootItemIndex);
				let amount = Math.floor(Math.random() * (lootItem.quanity[1] - lootItem.quanity[0])) + lootItem.quanity[0];
				for(var i = 0; i < amount; i++){
					array.push({
						name:lootItemIndex
					});
				}
			}
			else array.push({
				name:lootItemIndex
			});
		}
	}
	console.log(array);
}

var trashCounter = 0;
function addTrash(){
	if(trashCounter < 10){
		trashCounter = trashCounter + 1;

		let element = {
			type:'trash',
			maxDistance:Math.round(Math.random()*(500)) + 1200,
			angle:Math.random()*(Math.PI*2),
			inventory:fillWithLootFromTable([], trashLootTable)
		}
		environment.push(element);

		io.emit('insertMapElement', element, environment.length - 1);
	}

	setTimeout(addTrash, 10000);
}
addTrash();




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

        client.emit('getMap', environment);
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

	client.on('statUpdate', function(stat, value){
		client.broadcast.emit('statUpdate', this.username, stat, value);
	});


	client.on('messages', function(data) {//If we get a message, it comes with some data
        client.emit('chatMessage', this.username, data);//Send message back to the guy who sent it
        client.broadcast.emit('chatMessage', this.username, data);//Send message back to everyone else
    });


});

server.listen(4200);  