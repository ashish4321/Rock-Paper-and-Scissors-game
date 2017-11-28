// app.js
var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);


//for working with arrays
function shuffle(array){//Not my code, JavaScript implementation of Fisher-Yates(Knuth) shuffle.
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

function countInArray(array, value) {
  return array.reduce((n, x) => n + (x.name === value), 0);
}
//end of array functions


function removeMapItem(index){
	environment.splice(index, 1);
	io.emit('removeMapElement', index);
}

app.use(express.static(__dirname + '/public'));  

app.get('/', function(req, res,next){
    res.sendFile(__dirname + '/public/game.html');
});


var players = [];


//Start of item stuffs
function giveItem(player, item){
	if(!item.quanity)item.quanity = 1;//make sure the item has a quanity, if it does make it one

	for(let bagIndex in player.inventory){//Go through every bag type thingy in the player's inventory,
		var bag = player.inventory[bagIndex];//this is a shortcut

		for(let index = 0; index < Object.keys(bag.inventory).length; index++){//Go through every item in the bag's inventory, be that inventory an array or object
			let bagItemIndex = Object.keys(bag.inventory)[index];
			let bagItem = bag.inventory[bagItemIndex];//shortcut

			if(bagItem.name === item.name){//if the items are the same,
				player.inventory[bagIndex].inventory[bagItemIndex].quanity = player.inventory[bagIndex].inventory[bagItemIndex].quanity + item.quanity;//increase the quanity of that item
				return true;//and let wherever this function was called know that the placement was successful
			}
		}
	
		//if we've made it here, that means the item isn't already present in the player's inventory,
		if(bag.slots && bag.inventory.length < bag.slots){//So lets see if the player has enough room for a new slot
			player.inventory[bagIndex].inventory.push(item);//if they do, put it in the inventory
			return true;//and let wherever this function was called know that the placement was successful
		}
	}

	return false;//If none of the above worked, there was simply not enough room in the inventory, so return false.
}


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
	'soiled rag':{
		rarity:40,
		quanity:[1, 2]
	},
	'cardboard':{
		rarity:80,
		quanity:[3, 5]
	},
	//crafting base materials
	/*
	'can':{
		rarity:65,
		quanity:[3, 5]
	},*/
	'magicked wax':{
		rarity:90,
		quanity:1
	},
	//base material manipulators
	/*
	'laser welder':{
		rarity:10,
		quanity:1
	},*/
	'magical needle':{
		rarity:10,
		quanity:1
	},
	//crafting tier two craftable base materials
	/*
	'long metal pipe':{
		rarity:0.35,
		quanity:1
	},
	'short metal pipe':{
		rarity:1,
		quanity:1
	},*/
	'waxen frame':{
		rarity:0.05,
		quanity:1
	},
	'waxen tendril':{
		rarity:2,
		quanity:1
	},
	//crafting tier two craftable ammunition
	/*
	'metal shard':{
		rarity:0,
		quanity:1
	},
	'metal ball':{
		rarity:0,
		quanity:1
	},
	'metal plate':{
		rarity:0,
		quanity:1
	},
	'waxen blade':{
		rarity:0,
		quanity:1
	},
	'waxen glob':{
		rarity:0,
		quanity:1
	},
	'waxen slab':{
		rarity:0,
		quanity:1
	},*/
	//crafting teir two findables
	/*
	'kinetic accelerator':{
		rarity:5,
		quanity:1
	},
	*/
	'tapped rune':{
		rarity:5,
		quanity:1
	},
	//crafting teir two weapons
	/*
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
	},*/
	'scepter':{//three tendril, TR
		rarity:0.25,
		quanity:1
	},
	/*
	'loopshield':{//five tendril, TR
		rarity:0.1,
		quanity:1
	},
	*/
	'trident':{//tendril frame, three tendril, TR
		rarity:0.05,
		quanity:1
	} /*,
	'launcher':{//tendril frame, seven tendril, 2 TR
		rarity:0.01,
		quanity:1
	}*/
}


function fillWithLootFromTable(array, lootTable){
	for(let lootItemIndex in lootTable){
		let lootItem = lootTable[lootItemIndex];

		if(Math.random()*100 < lootItem.rarity){
			let amount;

			if(Array.isArray(lootItem.quanity))amount = Math.floor(Math.random() * (lootItem.quanity[1] - lootItem.quanity[0])) + lootItem.quanity[0];
			else amount = lootItem.quanity;

			for(var i = 0; i < amount; i++){
				array.push({
					name:lootItemIndex
				});
			}
		}
	}
	return shuffle(array);
}

//End of item stuffs



//environment stuffs
var environment = [{
	type:'teleporter',
	x:0,
	y:0
}];

function addTrash(){
	let trashCounter = 0;

	environment.forEach(mapItem => {
		if(mapItem.type === 'trash')trashCounter++;
	});

	if(trashCounter < 10){

		let element = {
			type:'trash',
			maxDistance:Math.round(Math.random()*(500)) + 1200,
			angle:Math.random()*(Math.PI*2),
		}
		environment.push(element);

		io.emit('insertMapElement', element, environment.length - 1);

		element.inventory = fillWithLootFromTable([], trashLootTable);
	}

	setTimeout(addTrash, 10000);
}
addTrash();




io.on('connection', function(client) {  


	client.on('usernameCheck', function(username){
		var usernames = Object.keys(players);

		if(!(usernames.indexOf(username)+1)){
			players[username] = {};
			players[username].inventory = {
				'equipped':{
					inventory:{
						'rock':{
							name:'rock',
							quanity:1
						},
						'paper':{
							name:'paper',
							quanity:1
						},
						'scissors':{
							name:'scissors',
							quanity:1
						}
					}
				},
				'Default Inventory':{
					slots:5,
					color:'186,186,186',
					inventory:[]
				}
			};
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

        client.emit('getMap', environment);//And tell him about this world he's about to find himself in.
        client.emit('recieveInventoryData', this.username, players[this.username].inventory);
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


    client.on('requestInventoryData', function(index){
    	if(typeof index === "number"){
	    	client.emit('recieveInventoryData', index, environment[index].inventory);
	    	
	    	if(environment[index].inventory.length === 0)removeMapItem(index);
    	}

    	else if(players[index]){
    		client.emit('recieveInventoryData', this.username, players[index].inventory);
    	}
    });

    client.on('takeItem', function(takenFromMapIndex, itemName){
    	let item = {
    		name:itemName,
    		quanity:countInArray(environment[takenFromMapIndex].inventory, itemName)
    	}

    	if(giveItem(players[this.username], item)){
    		client.emit('recieveInventoryData', this.username, players[this.username].inventory);

	    	environment[takenFromMapIndex].inventory = environment[takenFromMapIndex].inventory.filter(a => a.name !== itemName);

	    	client.emit('recieveInventoryData', takenFromMapIndex, environment[takenFromMapIndex].inventory);
	    	client.broadcast.emit('recieveInventoryData', takenFromMapIndex, environment[takenFromMapIndex].inventory);

	    	if(environment[takenFromMapIndex].inventory.length === 0)
	    		removeMapItem(takenFromMapIndex);
    	}

    	else client.emit('chatMessage', 'Server', "No room! Clear up some space, press the \"F\" key to open your inventory.");
    });
});

server.listen(4200);  