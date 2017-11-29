var canvas;//  We'll define these
var ctx;//	   guys later.

//Background variables
var primaryColor   = '#282828';
var secondaryColor = '#505050';
var backgroundGradient;//This guy is the gradient for the background.

//These are called on the screen's resize.
var callOnResize = [];

//this guy is overwritten later
var localPlayer;

//User input variables
var pressedKeys = [];
var currentMouseEvent;

//network variables
var socket;
var otherPlayers = {};//This keeps track of everyone else.

//images variables
var images = [];
var newImages = {};
const sources = [
	'imgs/rockSmall.png', 'imgs/paperSmall.png', 'imgs/scissorsSmall.png', 
	'imgs/rockMedium.png', 'imgs/paperMedium.png', 'imgs/scissorsMedium.png',
	'imgs/rockBig.png', 'imgs/paperBig.png', 'imgs/scissorsBig.png'
];


function startScreen(){
	//On or off variable
	var startScreenOn = true;

	//Title variables
	var indexOfBigLetter = 0;
	var bigLetterSizeBonus = 0;
	var bigLetterSizeBonusChangeRate = 10;
	const titleText = 'Rock Paper Scissors';

	//Waterfall of items variables
	var items = [];

	//Buttons variables. Right now they just contain a name, and some code to run when they're clicked, but later they will get bounding rects that allow them to be clicked.
	const buttons = [
		{
			name:'Adventure',
			onClick:function(cleanUp, cleanUpButtons){
				socket = io.connect('http://' + window.location.hostname + ':4200');

				cleanUpButtons();//We don't want the other buttons to be able to be pressed.
				var username = getCookie("username");

				function testUserName(username, callIfGood, callIfBad){
					var error = "";//Set error as empty, to start with

					//And then see if it meets any of the criteria that would make it a bad username
					if(['yourrealname', 'your real name', 'no'].indexOf(username.toLowerCase()) + 1)error = error + 'That\'s not fair! Only I get to crack jokes! ';
					if(username == "" || !(/^[a-zA-Z]+$/.test(username)))error = error + "Username must consist of only letters, and can't be empty. ";
					if(username.length < 3 || username.length > 9)error = error + "Username must be inbetween 3 and 9 characters, inclusive. ";

					if(error){//If it does,
						$('#message').text(error);//Let them know what they did wrong
						return;//And then leave before any of the next code is ran.
					}
					//username !== "" && /^[a-zA-Z]+$/.test(username) && username.length > 2 && username.length < 10

					//If the username has made it here, then it's not bad.
					socket.emit('usernameCheck', username);//So we'll ask the server if it's already been taken.

					socket.on('usernameResponse', function(isGood){//It'll respond and let us know.
						if(isGood)callIfGood();//If it isn't already in use, call the function that was passed to this function for this purpose.
						else {//But if it's already taken,
							$('#message').text("Username is taken.");//Let the user know,
							if(callIfBad)callIfBad();//And call the function that's passed to this function if such a thing were to happen.
						}
						socket.off('usernameResponse');//And then we'll stop searching for a username response, since we've already gotten one.
					});
				}
				
				function promptForUserName(){//This makes a pretty box that asks for a username.
					$('body').append('<div class = promptBox id = usernamePromptBox style = top:' + (canvas.height/2 - 100) + 'px;left:' + (canvas.width/2 - 250) + 'px;></div>');
					//This is the parent box, it's placed in the center of the screen.

					var nameBox = $('#usernamePromptBox');//We'll store it as a variable for efficiency and easy access.
					nameBox.append('<h1 style = margin-bottom:0px;>Input Username</h1>');//Here's the title for the box
					nameBox.append('<hr>');//And the bar that follows
					nameBox.append('<div id = usernameInputBox contenteditable = true></div>');//Here's the place where they put in their username.
					nameBox.append("<p id = message>Use your real name! Right now the game can only be hosted locally. This means that you'll only be playing with people who are within the same building as you are, and those people will likely appreciate being able to figure out who they're playing with.</p>");
					//Above is the paragraph that encourages them to use their real name.
					nameBox.append('<div class = button id = save style = right:20px;><span style=margin:0px;>Save</span></div>');
					//And then we have the play and save buttons.
					nameBox.append('<div class = button id = play style =  left:20px;><span style=margin:0px;>Play</span></div>');
					//And then we have the play and save buttons.

					$('#usernameInputBox').focus();//We'll set the username input box as focused, so they can immediately start typing into it.

					$('#play').on('click', () => {//If they press play:
						//We'll use arrow syntax because this function doesn't need it's own instance of this.
						username = $('#usernameInputBox').text();
						testUserName($('#usernameInputBox').text(), function(){//Send testUserName their username,
							cleanUp();//Disable the start screen
							nameBox.remove();//Remove the prompt box
							startAdventure(username);//And start the game
						});
					});

					$('#save').on('click', () => {//If they press save,
						//Using arrow function for efficiency
						username = $('#usernameInputBox').text();
						testUserName($('#usernameInputBox').text(), function(){//send testUsername their username,
							cleanUp();//Disable the start screen
							setCookie('username', $('#usernameInputBox').text(), 30);//Save it as a cookie.
							nameBox.remove();//Remove the prompt box
							startAdventure(username);//And start the game
						});
					});

					$('#usernameInputBox').on('keydown', function(event){//Here we add an event listener,
						if(event.key == 'Enter'){//Which, if they press enter,
							$('#play').click();//Presses the play button
							return false;//And then returns false, disabling enter's propagation and default behavior.
						}
					});
				}

				if(!username || username == "")promptForUserName();
				//Earlier we set username as a cookie, but if they didn't have a username cookie, then ask them for one.

				else {//But if they did, then
					testUserName(username, function(){//Test it to make sure it still works, if it does
						cleanUp();//Stop updating the background,
						setCookie('username', username, 30);//Postpone the expiration of the username cookie,
						startAdventure(username);//And then start the game
					}, function(){// but if it doesn't, we'll assume it was a good username but someone else already had it.
						promptForUserName();//So ask 'em for a new one,
						$('#message').text('Saved username taken. Please select a new one');// and let them know why their old one didn't work.
					});
				}
			}
		},

		{
			name:'Clear Username', //In case they aren't happy with their old username, or someone else is on.
			onClick:function(){
				//We'll set the username cookie to have an expiration date that's already passed, so it'll go away.
				document.cookie = 'username=;expires=Thu, 01 Jan 1970 00:00:01 GMT;'
			}
		},

		{
			name:'Credits',
			onClick:function(cleanUp, killButtons, reviveButtons){

				killButtons();//They don't need to press any of the start screen buttons if the credits are up.

				//We'll stick a prompt box in the middle of the screen,
				$('body').append('<div class = promptBox id = creditsBox style = top:' + (canvas.height/2 - 100) + 'px;left:' + (canvas.width/2 - 250) + 'px;></div>');
				var credBox = $('#creditsBox');//Save it as a variable for efficiency and ease of access

				credBox.append('<h1>Credits</h1>');//Give the credits box a title, just in case they forget about what they clicked.
				credBox.append('<hr>');//And a bar underneath of the title, because that looks cool.
				credBox.append('<p>'//Start a paragraph,
				+ '<li>As of right now:'//Let them know that this could change, and then list out the credits.
				+ '<li> Programmer: Cedric Hutchings'
				+ '<li> Designer: Cedric Hutchings'
				+ '<li> Artist: Cedric Hutchings'
				+ '<br><br><span style = font-size:10px;>If you go and contribute to the project on GitHub, you can add your name here!</span>'
				//And let people know that this project is open source and on github.
				+ '</p>');
				credBox.append('<div id = ok class = button style = right:35px;bottom:50px;>Ok</div>');
				//And then make an okay button so they aren't trapped in the credits forever.
				$('#ok').on('click', function(){//If they click on the okay button,
					credBox.fadeOut("slow", function(){//Fade out of the credits,
						credBox.remove();//Remove the credits once fading out is done,
						reviveButtons();//And revive the buttons we killed when the credits started.
					});
				});
			}
		},

		{
			name:'Information',
			onClick:undefined//This doesn't work right now!
		}
	]

	sources.forEach(function(element){// Pretty simplistic, all we do here is
		var image = new Image();// Define a new image,

		image.onload = function(){//Tell the image that when it's done loading,
			images.push(image);// Put it in an array for us.
		}

		image.src = element;// And then we tell it where to find the aforementioned image.
	});


	var paintGradient = function(){

		ctx.fillStyle = backgroundGradient;// 			   Set the background gradient as our brush
		ctx.fillRect(0, 0, canvas.width, canvas.height);// and slop it onto the screen.

	};

	var paintTitle = function(){
		var fontSize = canvas.width/12;//The width/12 part makes the font size scale to the screen size.
		ctx.font = fontSize + 'px Modak';//define font

		var textDim = ctx.measureText(titleText);	 	//We'll need the text's dimensions to position it correctly.
		textDim.x = canvas.width/2 - textDim.width/2;	//Here we calculate the x (center)
		textDim.y = canvas.height/4;					//and the y (top fourth of the page)

		var textGradient = ctx.createLinearGradient(textDim.x, textDim.y, textDim.x+textDim.width, textDim.y);
		//bounds for gradient

		textGradient.addColorStop(0,   'dimgray');
		textGradient.addColorStop(0.5, 'gray');
		textGradient.addColorStop(1,   'dimgray');
		//These three color stops should make the text appear kind of shiny.

		var currentX = textDim.x;
		//Curent x will keep track of where our next letter should be drawn.

		ctx.fillStyle = textGradient;//Use the shiny metal gradient that we just made as our brush

		for(var letterIndex = 0; letterIndex < titleText.length; letterIndex++){
			var letter = titleText[letterIndex];//Letter will be what we draw this loop.s

			if(letterIndex == indexOfBigLetter){//If this guy is the big letter,
				ctx.font = (fontSize + bigLetterSizeBonus) + 'px Modak';//Make the font size change
				bigLetterSizeBonus = bigLetterSizeBonus + bigLetterSizeBonusChangeRate;
				//Change the font size next turn.

				if(bigLetterSizeBonus === 0 && bigLetterSizeBonusChangeRate < 0){//This passes the size bonus on to the next letter if it's gotten big and then smaller again.
					bigLetterSizeBonusChangeRate = bigLetterSizeBonusChangeRate*-1;
					indexOfBigLetter++;

					if(indexOfBigLetter === titleText.length)indexOfBigLetter = 0;
					//This sets it back to the beginning if it's gone through the entire title.
				}

				else if(bigLetterSizeBonus > 10)bigLetterSizeBonusChangeRate = bigLetterSizeBonusChangeRate * -1;
				//Above line reverses direction of size increase

				if(letter === ' ')ctx.font = fontSize + 'px Modak';
				//This stops the increase of the font size if the letter is a space.
			}

			ctx.fillText(letter, currentX, textDim.y);
			ctx.strokeStyle = 'darkgray';
			ctx.strokeText(letter, currentX, textDim.y);

			ctx.font = fontSize + 'px Modak';//Could probably use ctx.fontSize = fontSize, but I don't trust ctx.fontSize.

			currentX = currentX + ctx.measureText(letter).width;//Move the text forward, essentially
		}

	};

	var paintItems = function(){
		//Return if all of the sources aren't loaded, because then we have nothing to draw.
		if(images.length !== sources.length)return;

		items = [];//We'll fill this guy up with the next loop, then we'll rewrite the function so that it just draws everything in this array.

		//Six here because there are six columns
		for(var x = 0; x < 6; x++){
			//This for loop adds one row for each row that is needed.
			for(var heightUsed = 0; heightUsed < (canvas.height+32); heightUsed = heightUsed + 32){
				items.push({
					image:chooseFrom(images), //just a random image of rock, paper, or scissors.
					y:heightUsed + (Math.round(Math.random()*20)-10), //The randomness is to stop them from appearing in rows.
					x:((x>2) ? canvas.width-canvas.width/25-(32*(x-3)) : canvas.width/25 - (32*(x-1))) + (Math.round(Math.random()*20)-10), //This ternary operator decides which side of the screen the item should go on.
					rot:0, //Maybe add rotation later?
					descentVelocity:Math.random()*5+2 //So this way the max velocity is anywhere from 2 to 7
				})
			}
		}

		callOnResize.push(paintItems);//We push the first version of paintItems into callOnResize, so if the screen changes the above code resets the waterfall.

		paintItems = function(){//Here we redfine the function, just for drawing this time because we don't need to initialize the item array each time we go to draw it.
			items.forEach(function(item){
				item.y = item.y + item.descentVelocity;//Add the descent velocity: make 'em move downward.
				if(item.y > canvas.height)item.y = -32;//Reset the height if needed
				ctx.drawImage(item.image, item.x, item.y);//Draw the item.
			});
		}
	};

	var paintButtons = function(){
		buttons.forEach(function(element, index){

			//Aesthetics
			ctx.strokeStyle = 'darkgray';
			var oldFill = ctx.fillStyle;

			//This'll hold the dimensions of our box.
			var dimensions = {
				width:canvas.width*0.28,
				height:canvas.height/11
			}
			dimensions.x = canvas.width/2 - dimensions.width/2;			    //X and Y are defined outside of the object because
			dimensions.y = canvas.height*0.4 + canvas.height/7*index;	   //they are reliant upon those inside the box.

			element.dimensions = dimensions;//Here we give the dimensions to the objects in the buttons array so that they can be used to test for clicking.

			ctx.fillRect(dimensions.x, dimensions.y, dimensions.width, dimensions.height);
			ctx.strokeRect(dimensions.x, dimensions.y, dimensions.width, dimensions.height);

			var fontSize = canvas.height/17;
			ctx.font = fontSize + 'px Modak';
			//I would use ctx.fontSize here, but I want to make sure the font is Modak.

			ctx.fillStyle = backgroundGradient;

			var textSize = (ctx.measureText(element.name).width < dimensions.width - 5) ? ctx.measureText(element.name).width : dimensions.width - 5;
			//This way text size is effected by max-width too.

			ctx.fillText(  element.name, canvas.width/2 - textSize/2, dimensions.y + fontSize*1.1, dimensions.width - 5);
			ctx.strokeText(element.name, canvas.width/2 - textSize/2, dimensions.y + fontSize*1.1, dimensions.width - 5);
			ctx.fillStyle = oldFill;
		});
	}

	var animateScreen = function(){//This is the glue that sticks all of the functions defined earlier together.

		if(!startScreenOn)return;//If it's not on, don't draw it, duh!

		paintGradient();//call each of the functions defined above, in a certain order
		paintItems();//call each of the functions defined above, in a certain order
		paintTitle();//call each of the functions defined above, in a certain order
		paintButtons();//call each of the functions defined above, in a certain order

		requestAnimationFrame(animateScreen);//And then call it all over again.

	};

	animateScreen();//Call the recursive function, because it has to start somewhere.

	$(document).on('click touchstart', function checkForButtons(event){//And then add logic for the clicking of the buttons,
		event = (event.touches) ? event.touches[0] : event;
		buttons.forEach(function(button){//By looping through each of them,

			var bDim = button.dimensions;//And setting their dimensions as a variable, for ease of access.

			if(event.clientX  >  bDim.x  &&  event.clientX  <  bDim.x + bDim.width  &&  event.clientY  >  bDim.y  &&  event.clientY  <  bDim.y + bDim.height){
				if(button.onClick){//Notice that we're testing to see if the function exists, not if it returns true.

					//These functions give the next function in the chain some ability to control the start screen.
                    var cleanUp = function(){//This function ties up the loose ends that exist for the start screen.
						startScreenOn = false//Stop updating the screen, to kill it.
	                    $(document).off("click touchstart", checkForButtons);//Stop checking for buttons/
	                    callOnResize = [];//And clear the functions that are for resizing the start screen, since there is no start screen.
                	};

                	//These functions give the next function in the chain some ability to control the start screen.
                	var cleanUpButtons = function(){
                		$(document).off("click touchstart", checkForButtons);//This turns off this function's parent function.
                	};

                	//These functions give the next function in the chain some ability to control the start screen.
                	var reviveButtons = function(){
                		$(document).on("click touchstart", checkForButtons);//This turns this function's parent function back on.
                	};

                    //Calling function for this button:
					button.onClick(cleanUp, cleanUpButtons, reviveButtons);//Passes cleanup to function, so it's up to the function to clean up or leave the start screen on.
				}
			}
		});
	});

}



function startAdventure(username){
    //boolean, if it's off the loop goes off.
    var isPaused = false;
    
    //Map variables
    var mapDim;// map dimensions
    var mapGrad;// map gradient
    var gridGrad;// grid gradient

    environment.maxDistance = 1850;

    var drawLoadingScreen = function(){
		ctx.fillStyle = backgroundGradient;//And then we'll give them a loading screen that uses the default background.
		ctx.fillRect(0, 0, canvas.width, canvas.height);//and uses the default background to fill up the entire screen
		ctx.fillStyle = 'gray';//And then some gray text,
		ctx.fillText('Loading', canvas.width/2 - ctx.measureText('Loading').width/2, canvas.height/2);//that says loading.
	}

	callOnResize.push(drawLoadingScreen);

	const newSources = [
		'debris'
	];
	item.addItemIcons(newSources);
	var loadCounter = 0;

	newSources.forEach(function(source){
		let newImage = new Image();
		newImage.onload = function(){
			loadCounter = loadCounter + 1;
			newImages[source] = newImage;

			if(loadCounter >= newSources.length){
				callOnResize.splice(callOnResize.indexOf(drawLoadingScreen), 1);
				animationLoop();
			}
		}
		newImage.src = 'imgs/' + source + '.png';
	});


	localPlayer = getLocalPlayer(username);



    //Chat stuff
    $('body').append('<div id = chatBox></div>');//This makes the chat box
    $('body').append('<div id = sendBox></div>');//This makes the chat box
    $('#sendBox').append('<div id="chatInput" contenteditable=true></div>');//This makes the chat box
    $('#sendBox').append('<div id = sendButton>Send</div>');//This makes the chat box

    function chat(username, data){
		$('#chatBox').append('<span style = color:darkgrey;>' + '<span style = color:gray;font-weight:bold;>[' + username + ']</span> ' + data + "<br/>" + '</span>');
		//Put the chat message in the onscreen box.

		//And then cut out some chat messages if chat is too full.
		var contentHeight = 0;//To do that, first record how full the box is.
		$('#chatBox').children().each(function(){//Then go through each item in the box,
			contentHeight = contentHeight + $(this).height();//Add it's height to the counter.
		});
		//And then, for each row that exceeds the chat's limit, remove one chat message from the top.
		for(var contentHeight = contentHeight; contentHeight > 125; contentHeight = contentHeight - 18)$('#chatBox').children().first().remove();
    }

    socket.on('chatMessage', function(username, data){//On reception of chat message
		chat(username, data);
	});

    $('#sendButton').on('click', function(event){
		event.preventDefault();//Just in case there's some built in thingymobob that will get in our way.
		var message = $('#chatInput').text();//Get the message
		$('#chatInput').text('');//Reset the chat input

		if(message === '')return;//Don't bother sending if it's spammy.
		if(message[0] == '/'){//if it starts with slash,
			if(commands[message.substring(1)]){//And it's a command
				commands[message.substring(1)]();//call it.
				chat('Server', 'Command Recieved.');
			}
			else chat('Server', "That's not even a command.");//If it's not, let the user know so.
			return;//and return so everyone can't see that they entered a command
		}

		socket.emit('messages', message);//And then send the message to the server, who will then broadcast it to everyone else.
	 });
    //End of chat stuffs


	socket.emit('join');//Tell the server that we've entered a username and are now trying to play the game.


	//Map stuff
	socket.on('getMap', function(map){
		var mapComplete = [];
		map.forEach(function(element){
			element.alreadyLoaded = true;
			mapComplete.push(fleshOutMapObject(element));
		});
		environment.map = mapComplete;
	});

	socket.on('insertMapElement', function(element, index){
		environment.map.splice(index, 0, fleshOutMapObject(element));
	});

	socket.on('removeMapElement', function(index){
		if(localPlayer.interactables.indexOf(environment.map[index]) + 1)
			localPlayer.interactables.splice(localPlayer.interactables.indexOf(environment.map[index]), 1);
		
		environment.map.splice(index, 1);
	});

	socket.on('changeMapElement', function(index, attributeToChange, value){
		environment.map[index][attributeToChange] = value;
	});

	socket.on('callMapElementFunction', function(index, func, params){
		environment.map[index][func](...params);
	});

	//End of map stuff


	//start of inventory stuff

	socket.on('recieveInventoryData', function(index, inventory){
		if(index === localPlayer.username){
			localPlayer.inventory = inventory;

			for(bagIndex in localPlayer.inventory){
				let bag = localPlayer.inventory[bagIndex];

				Object.keys(bag.inventory).forEach(function(bagItemIndex){
					let bagItem = item.get(bag.inventory[bagItemIndex].name);
					
					for(let attribute in bag.inventory[bagItemIndex]){
						bagItem[attribute] = bag.inventory[bagItemIndex][attribute];
					}

					bag.inventory[bagItemIndex] = bagItem;
				});
			}

			getUI();
			callOnResize.push(getUI);
		}
	});

	//end of inventory stuff


	socket.on('newPlayer', function(username){//If it tells us about someone who's in the game,
		otherPlayers[username] = new player();//Make a new slot for them in a local object.
		otherPlayers[username].username = username;//And give that local object their username.
	});

	socket.on('deletePlayer', function(username){//If they've left.
		delete otherPlayers[username];//Don't bother with keeping track of them.
	});

	socket.on('movementUpdate', function(username, movement){//Looks like we've gotten some movement info from the server
		if(!otherPlayers[username])return;//If we haven't initialized this guy yet, then we better not record his info.
		otherPlayers[username].x = movement.x;//And then we just record the new info.
		otherPlayers[username].y = movement.y;//And then we just record the new info.
		otherPlayers[username].speed = movement.speed;//And then we just record the new info.
	});

	socket.on('statUpdate', function(username, stat, value){
		if(!otherPlayers[username])return;
		otherPlayers[username][stat] = value;
	});

	socket.on('swingUpdate', function(username, x, y, rotation){//Looks like someone's sent us some info about a swing they've swung.
		if(!otherPlayers[username])return;//But we don't want it if we haven't initialized him yet
		otherPlayers[username].getSwing(x, y, rotation);//Record this new swing, by passing the x and y to a function built into new player();
	});

	socket.on('healthUpdate', function(username, health){
		if(!otherPlayers[username])return;
		otherPlayers[username].health = health;
		otherPlayers[username].damage(0);//Damaging zero keeps health stats up to date.
	});

	socket.on('launchAttack', function(attacker, weapon, target, attackStats){
		target = (target == localPlayer.username) ? localPlayer : otherPlayers[target];
		//Quick little ternary operator to get our target, be it the local player or someone else.

		if(!otherPlayers[attacker] || !target)return;
		//No use in giving them the info if they don't know who it's for.

		otherPlayers[attacker].latestWeapon = item.get(weapon);
		target.getAttacked(otherPlayers[attacker], attackStats);
	});

	socket.on('requestAttack', function(target, attacker, attackStats){
		if(attacker == localPlayer.username){
			localPlayer.launchAttack(target, attackStats);
		}
	});

	var transmitPlayer = function(){//This sends our movement information to the server
		socket.emit('movementUpdate', {//We'll send this data to the server:
			x:localPlayer.x, //Our x,
			y:localPlayer.y, //Our y,
			speed:localPlayer.speed //and our speed so they can figure out where'll we be until our next transmission.
		});
		
		setTimeout(transmitPlayer, 50);//And then do again, so that it's done every 20Hz
	}
	setTimeout(transmitPlayer, 500);//Just so that half a second passes before transmission starts


	//End of network stuff

    //Start of Player UI


    var getUI = function(){

	    for(let counter = 0; counter < 3; counter++){
	    	let elementName = ['rock', 'paper', 'scissors'][counter];
	    	
	    	let element = localPlayer.inventory['equipped'].inventory[elementName];

			$('#' + elementName).remove();

			$('body').append('<div id = ' + elementName + ' class = hotBarBox style=left:' + (canvas.width*0.8 - 120 + counter*80) + 'px; > </div>');
			let elmtDiv = $('#' + elementName);

			if(elementName == localPlayer.currentHotbarSelection.name && !localPlayer.discreetMode){
				elmtDiv.css('border-color', 'rgba(255, 0, 0, 0.115)');
				elmtDiv.css('background-color', 'rgba(255, 0, 0, 0.1)');
			}

			refresh();


			function refresh(){
				elmtDiv.html('<img src = ' + element.img + '>');

				let color = elmtDiv.css('border-color').replace(/\s/g, '');
				color = color.split(',');
				color = color[0] + ',' + color[1] + ',' + color[2] + ',0.8)';
				elmtDiv.append('<h4 class = quanity style = color:' + color + '; >' + element.quanity + '</h4>');
			}

			elmtDiv.on('mouseenter', function(){
				elmtDiv.empty();
				elmtDiv.append('<h2>' + (counter + 1) + '</h2>');
				setTimeout(refresh, 500);
			});
			elmtDiv.on('click', function(event){
				event.preventDefault();
				localPlayer.currentHotbarSelection = element;
				getUI();
			});
			elmtDiv.on('mouseleave', refresh);

			localPlayer.keyMaps[counter + 1] = function(){
				elmtDiv.click();
			}
		}
	}
    //End of Player UI
    
    
    var getGradients = function(){
    	//This gradient is for the grey background
    	mapGrad = ctx.createRadialGradient(ctx.x + canvas.width/2, ctx.y + canvas.height/2, canvas.height, ctx.x + canvas.width/2, ctx.y + canvas.height/2, 0);
        mapGrad.addColorStop(0, primaryColor);
        //mapGrad.addColorStop(0.9, 'dimgray');
        mapGrad.addColorStop(1, secondaryColor);

        //This is for the fancy white grid in the background
        gridGrad = ctx.createRadialGradient(ctx.x + canvas.width/2, ctx.y + canvas.height/2, canvas.height, ctx.x + canvas.width/2, ctx.y + canvas.height/2, 0);
        gridGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gridGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1');
        
    }
    
    var drawBackground = function(){

    	getGradients();//TODO: tweak this so that it only happens each time the screen is resized.

        ctx.fillStyle = mapGrad;//First we'll draw the grey background
        ctx.fillRect(ctx.x, ctx.y, canvas.width, canvas.height);//Which filles the entire screen.

        ctx.strokeStyle = gridGrad;//Then we'll draw the grid
        //horizontal lines
        for(let y = ctx.y - (localPlayer.y % 32); y < ctx.y + canvas.height; y = y + 32){
        	//The modulus part makes it look like the grid follows the player. The rest just draws a line each 32 pixels.
    		ctx.beginPath();//Begin path
    		ctx.moveTo(ctx.x, y);//Start on the left
    		ctx.lineTo(ctx.x + canvas.width, y);//And slide across the screen.
    		ctx.stroke();//Stroke and close the path.
    		ctx.closePath();//Stroke and close the path.
        }

        //vertical lines
        for(let x = ctx.x - (localPlayer.x % 32); x < ctx.x + canvas.width; x = x + 32){
        	//The modulus part makes it look like the grid follows the player. The rest just draws a line each 32 pixels.
    		ctx.beginPath();//Start drawing
    		ctx.moveTo(x, ctx.y);//Go over to the top
    		ctx.lineTo(x, ctx.y + canvas.height);//And slide down the screen. Swap x and canvas.height and something really weird happens.
    		ctx.stroke();//stroke and close path
    		ctx.closePath();//stroke and close path
        }

        ctx.lineWidth = 5;

        ctx.strokeRect((environment.maxDistance+5)*-1, (environment.maxDistance+5)*-1, (environment.maxDistance+5)*2, (environment.maxDistance+5)*2);

        ctx.lineWidth = 1;
    }

    $('body').append('<div id = toolTipBox>Test</div>');
    $('#toolTipBox').hide();


	onkeydown = onkeyup = function(e){
		e = e || event; //to deal with IE //Although nothing else is IE proof... :D

		if(e.key == 'Enter' || e.key == 'Tab')e.preventDefault();//we don't need the weird default logic to be run, for enter

		pressedKeys[e.key] = e.type == 'keydown';//Record either the release of this key, or the press of this key. This allows us to not only call things when keys are pressed, but call things for as long as they are.
	}

	$(document).on('keydown keyup', onkeydown);//Call that handy lil' function we defined a few lines up.
	$(document).on('mousedown mouseup', function(event){
		let buttonNameArray = ['left-button', 'middle-button', 'right-button'];
		//This records all of the names of buttons that we can tell are being pressed, the index aligns with the number each button is assigned via event.button
		pressedKeys[buttonNameArray[event.button]] = event.type == 'mousedown';
		//That way, we can record the state of the button under it's name, instead of just some vague number.
		currentMouseEvent = event;//This way we can access the mouse's information from anywhere in the program.
	});
	$(document).on('mousemove', function(event){//This keeps the mouse's position updated when it moves and the left-button is held down.
		currentMouseEvent = event;//As you can see, here's where we overwrite the currentMouseEvent.
	});
	$(document).on('touchstart touchend', function(event){
		pressedKeys['left-button'] = event.type == 'touchstart';

		currentMouseEvent = event.touches[0];
		if(event.type == 'touchstart')$(document).on('touchmove', function(event){
			event.preventDefault();
			currentMouseEvent = event.touches[0];
		});
		else $(document).off('touchmove');
	});


    function animationLoop(){//This function is the glue that holds all of the other guys together
        if(isPaused)return;//Stop if the game is paused.
        
        drawBackground();//This draws the background

        environment.update();//This draws the map elements

        localPlayer.update();//We update the local player first,

        for(var playerIndex in otherPlayers){//And then we loop through the record of everyone he's player with,
        	otherPlayers[playerIndex].update();//and update each of them.
        }

        requestAnimationFrame(animationLoop);//And then it calls itself again.
    }
}

//End of Universal Functions



//Here'll be where we throw together all of our previously defined abstractions.
$(document).ready(function(){
	canvas = document.getElementById('gameCanvas');//Now that these guys have been loaded in,
	ctx = canvas.getContext('2d');//				 we'll initialize them.
	ctx.x = 0;
	ctx.y = 0;

	adjustScreen();

	$(window).on('resize', function(){
		adjustScreen();
	});

	startScreen();
});