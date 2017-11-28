var canvas;//  We'll define these
var ctx;//	   guys later.

//Background variables
var primaryColor   = '#282828';
var secondaryColor = '#505050';
var backgroundGradient;//This guy is the gradient for the background.

//These are called on the screen's resize.
var callOnResize = [];

//User input variables
var pressedKeys = [];
var currentMouseEvent;

//network variables
var socket;

//images variables
var images = [];
const sources = [
	'imgs/rockSmall.png', 'imgs/paperSmall.png', 'imgs/scissorsSmall.png', 
	'imgs/rockMedium.png', 'imgs/paperMedium.png', 'imgs/scissorsMedium.png',
	'imgs/rockBig.png', 'imgs/paperBig.png', 'imgs/scissorsBig.png'
];

//Universal Functions. 
//Generally speaking, the more simple the function, the higher up in the script it is.

function chooseFrom(anArray){ //This function chooses something from an array.
  return anArray[Math.floor(Math.random() * anArray.length)];
}

String.prototype.capitalize = function(){
	return this.replace(/\b\w/g, l => l.toUpperCase())
}

function adjustScreen(){

	canvas.width  = $(window).width();//Get the screen's width to fill all available space.
	canvas.height = $(window).height();//Get the screen's height to fill all available space.

	backgroundGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);//define bounds for gradient
	backgroundGradient.addColorStop(0, primaryColor);//Define start of left column
	backgroundGradient.addColorStop(1, secondaryColor);//Define beginning of right column

	callOnResize.forEach(function(element){//Here we'll just loop through
		element(); //everything in callOnResize
	});

}

function setCookie(cname, cvalue, exdays) {//From w3 Schools
    var d = new Date();//We get the date,
    d.setTime(d.getTime() + (exdays*24*60*60*1000));//and then add exdays translated into days to the number.
    var expires = "expires="+ d.toUTCString();//Then we translate that number into something the cookie string can understand.
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";//and then make it a cookie, after concatenating all of the data together in the right format.
}

function getCookie(cname) {//Also from w3 schools
    var name = cname + "=";//We'll add an equals sign to the name, to make it easier to find.
    var decodedCookie = decodeURIComponent(document.cookie);//Translate the cookie string into something easier to understand.
    var ca = decodedCookie.split(';');//Divide the cookie string into each individual cookie
    for(var i = 0; i <ca.length; i++){//And then loop through each cookie,
        var c = ca[i];//We'll set the cookie for this loop as a variable, for ease of access.
        while (c.charAt(0) == ' ') {//while the cookie starts with a space
            c = c.substring(1);//Get the text after the space
        }//Once you've done that,
        if (c.indexOf(name) == 0) {//If you can find cname with an equals after it,
        	//(because if there isn't an equals after it, it could be a cookie with a longer name that also contains the original name)
            return c.substring(name.length, c.length);//Return that cookie, because it's the one we need.
        }
    }
    return "";//If the cookie just isn't there, return an empty string.
}

function getOffScreenCanvas(image){
	var offScreen = {};
	offScreen.canvas = document.createElement('canvas');
	offScreen.canvas.width = image.height;
	offScreen.canvas.height = image.width;
	offScreen.ctx = offScreen.canvas.getContext('2d');

	offScreen.ctx.drawImage(image, 0, 0);

	return offScreen;
}

function changeImageTransparency(image, transparencyPercentage){
	let offScreen = getOffScreenCanvas(image);

	let imageData = offScreen.ctx.getImageData(0, 0, offScreen.canvas.width, offScreen.canvas.height);
	let data = imageData.data;

	for(let index = 0; index < data.length; index = index + 4){
		//let red   = data[index + 0];
		//let green = data[index + 1];
		//let blue  = data[index + 2];
		let alpha = data[index + 3];
		data[index + 3] = Math.round(alpha*transparencyPercentage);
	}

	offScreen.ctx.clearRect(0, 0, offScreen.canvas.width, offScreen.canvas.height);
	offScreen.ctx.putImageData(imageData, 0, 0);

	return offScreen.canvas;
}

function getImageChunk(image){
	let offScreen = getOffScreenCanvas(image);

	let width  = Math.round(Math.random()*(image.width - 1)) + 1;//anything from 1 to image.width(zero is illegal)
	let height = Math.round(Math.random()*(image.height - 1)) + 1;//same for height
	let x = Math.round(Math.random()*image.width - width);//max will be the total width divided by the width of the chunk, minimum would be 0
	let y = Math.round(Math.random()*image.height - height);//same for height

	let imageData = offScreen.ctx.getImageData(x, y, width, height);
	offScreen.canvas.width = width;
	offScreen.canvas.height = height;

	offScreen.ctx.putImageData(imageData, 0, 0);

	return offScreen.canvas;
}


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

    var maxDistance = 1850;

    var drawLoadingScreen = function(){
		ctx.fillStyle = backgroundGradient;//And then we'll give them a loading screen that uses the default background.
		ctx.fillRect(0, 0, canvas.width, canvas.height);//and uses the default background to fill up the entire screen
		ctx.fillStyle = 'gray';//And then some gray text,
		ctx.fillText('Loading', canvas.width/2 - ctx.measureText('Loading').width/2, canvas.height/2);//that says loading.
	}

	callOnResize.push(drawLoadingScreen);

	var newImages = {};
	const newSources = [
		'debris'
	];
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

    function player(){
    	//Movement stuff upcoming.
		this.x = 0;
		this.y = 0;
		this.speed = {
			x:0,
			y:0
		}
		this.maxSpeed = 7;
    	this.speedIncrease = 0.5;
    	this.speedDecrease = 0.05;

    	//This stores the direction that the player is facing.
    	this.rotation = 0;

		this.swings = [];//This records all of the player's swings.

		this.trailCoords = (function(){//This records all of the coordinates for his fancy tail.
    		let trailCoords = [];
    		for(let i = 0; i < 15; i++)trailCoords.push([0, 0]);
    		return trailCoords;
    	})();

    	//These are for the little fading in and out thing the player does.
		this.intensity = 0.8;
    	this.intensityChangeRate = 0.005;
    	this.intensityMax = 1;
    	this.intensityMin = 0.8;
    	//These are saves so that we can change them later.
    	this.intensityMaxDefault = this.intensityMax;
    	this.intensityDifference = this.intensityMax - this.intensityMin;

    	//Health and armor values
    	this.health = 100;
    	this.maxHealth = this.health;
    	this.armor = 0;
    	this.maxArmor = this.maxHealth;

    	this.keyMaps = {};//This stores all of the user input logic.
    	this.isFighting = [];
    	
    	//Attack values
    	this.currentWeapon = undefined;//Once items are defined, this is set to rock.
    	this.launchedAttackWith = undefined;
    	this.attacks = [];
    	

    	this.damage = function(amount, dealtBy){
    		if(this.health <= 0)return;//Because there's no use in killing that which is already dead.

    		this.health = this.health - ((amount - this.armor > 0) ? amount - this.armor : 0);//Knock off however much health needs to be knocked off.

    		if(this.health <= 0){
    			this.kill(dealtBy);//Boom! Ya ded!
    			return;
    		}

    		this.intensityMax = (this.intensityDifference) + (this.intensityMaxDefault - this.intensityDifference)*(this.health/this.maxHealth);
    		//The above line makes the player's color less intense if they've been damaged, but not so much that they become entirely invisible.
    		this.intensityMin = this.intensityMax - this.intensityDifference;//And then we'll adjust these to fit intensityMax
    		this.intensity = this.intensityMin;//And then we'll adjust these to fit intensityMax
    	};

    	this.kill = function(dealtBy){
    		this.health = 0;

    		this.intensityMax = 0.05;
    		this.intensityMin = 0.05;
    		this.intensity = 0.05;

    		//Maybe a death animation?
    		//Draw a grave where they die?
    	}

    	this.launchAttack = function(targetUsername, attackStats){//STAB THEM!
    		this.hasLaunchedAttack = true;
    		this.latestWeapon = this.currentWeapon;
    		socket.emit('launchAttack', targetUsername, this.latestWeapon.name, attackStats);
    		otherPlayers[targetUsername].getAttacked(localPlayer, attackStats);
    	}

    	this.getAttacked = function(attacker, attackStats){
    		let weapon = attacker.latestWeapon;
    		weapon.onHit(this, attacker, attackStats);
    	}

    	this.move = function(x, y){
			this.x = this.x + x;//Pretty simple,
			this.y = this.y + y;//only made into a function so that it can be overwritten for localPlayer
		};

		this.calculate = function(){

			this.calculateSwings();//Do math for swings

			this.intensity = this.intensity + this.intensityChangeRate;//Do some intense math right here, it makes the player's opacity fade in and out.
	    	if(this.intensity > this.intensityMax)this.intensityChangeRate = this.intensityChangeRate * -1;//Do some intense math right here, it makes the player's opacity fade in and out.
	    	else if(this.intensity < this.intensityMin)this.intensityChangeRate = this.intensityChangeRate * -1;//Do some intense math right here, it makes the player's opacity fade in and out.

			this.trailCoords.splice(this.trailCoords.length - 1, 1);//Remove the last trail coord
			this.trailCoords.unshift([this.x, this.y]);//Add a new one to the beginning

			this.move(this.speed.x, this.speed.y);//scoot over a bit

	        for(let keyMap in this.keyMaps)if(pressedKeys[keyMap]){//Loop through the record of pressed keys.
	        	if($('#chatInput').is(':focus') && keyMap.length <= 1 && /^[a-z0-9]+$/i.test(keyMap))continue;//If the key in question is an alphanumeric key and the chat is being used, don't bother.
	        	this.keyMaps[keyMap]();//Do whatever it is that this key is supposed to do.
	        };

	        //Here we do the calculations for speed. This could probably be made more efficient, but that's a task for another day.
			if(this.speed.x > 0)this.speed.x = ((this.speed.x - this.speedDecrease) > 0) ? this.speed.x - this.speedDecrease : 0;
			else if(this.speed.x < 0)this.speed.x = ((this.speed.x + this.speedDecrease) < 0) ? this.speed.x + this.speedDecrease : 0;

			if(this.speed.y > 0)this.speed.y = ((this.speed.y - this.speedDecrease) > 0) ? this.speed.y - this.speedDecrease : 0;
			else if(this.speed.y < 0)this.speed.y = ((this.speed.y + this.speedDecrease) < 0) ? this.speed.y + this.speedDecrease : 0;
		}

		this.draw = function(){
	    	
	    	this.drawSwings();//Draw the swings first.

	    	trailGradient = ctx.createRadialGradient(this.x, this.y, 125, this.x, this.y, 0);//Set bounds for gradient
	    	trailGradient.addColorStop(0, 'rgba(255, 0, 0, 0)');//Part of swing that is inside of the player
	    	trailGradient.addColorStop(0.85, 'rgba(255, 0, 0, ' + this.intensity/4 + ')');//This part is outside of the player
	    	trailGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');//Fade off towards very edge of trail
	    	
	    	ctx.strokeStyle = trailGradient;//Use aforementioned gradient for drawing the tail.

	    	this.trailCoords.forEach(function(element, index){//Then we loop through each of the trailcoords,
	    		ctx.lineWidth = this.trailCoords.length - index;//Set width of this section to the opposite of the section's index.
	    		ctx.beginPath();//Begin drawing

	    		let lastCoordsX = (this.trailCoords[index-1]) ? this.trailCoords[index-1][0] : this.x;//Set coordinates for the last part of the trail, if there aren't any, use the current coordinates.
	    		let lastCoordsY = (this.trailCoords[index-1]) ? this.trailCoords[index-1][1] : this.y;//Set coordinates for the last part of the trail, if there aren't any, use the current coordinates.

	    		ctx.moveTo(lastCoordsX, lastCoordsY);//Go to where the trail was last
	    		ctx.lineTo(element[0], element[1]);//Draw over to where it should be next

	    		ctx.stroke();//Draw and end drawing.
	    	}.bind(this));

	    	ctx.lineWidth = 1;//Set line width back to normal

	    	//Now we draw the actual player.
	    	let gradient = ctx.createRadialGradient(this.x, this.y, 16, this.x, this.y, 0);//Set his gradient,
	    	gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');//Make him clear in the middle
	    	gradient.addColorStop(1, 'rgba(255, 0, 0, ' + this.intensity + ')');//use his intensity towards the edges

	    	ctx.fillStyle = gradient;//Use the aforementioned gradient.

	    	ctx.beginPath();//Start drawing him
	    	ctx.arc(this.x, this.y, 16, 0, 2*Math.PI);//Draw him as a big ole' circle.

	    	ctx.fill();//Fill him in and finish drawing.


	    	let armorGradient = ctx.createRadialGradient(this.x, this.y, 16, this.x, this.y, 0);
	    	armorGradient.addColorStop(0, 'rgba(100, 100, 100, 0)');
	    	armorGradient.addColorStop(0.2, 'rgba(100, 100, 100, ' + (this.armor/this.maxArmor)*0.85 + ')');
	    	armorGradient.addColorStop(1, 'rgba(100, 100, 100, 0)');

	    	ctx.fillStyle = armorGradient;//Use the aforementioned gradient.

	    	ctx.beginPath();//Start drawing him
	    	ctx.arc(this.x, this.y, 16, 0, 2*Math.PI);//Draw him as a big ole' circle.

	    	ctx.fill();//Fill him in and finish drawing.
	    }

	    this.drawUI = function(){
	    	for(let attacker in this.attacks){
	    		let attack = this.attacks[attacker];
	    		if(!attack.isDying && localPlayer.discreteMode)break;
	    		
	    		let weapon = itemList[this.attacks[attacker].weapon];
	    		let progressDecimal = (1 - -1*(Date.now() - attack.attackExpires)/10000).toFixed(2);
	    		progressDecimal = (progressDecimal > 0.30) ? progressDecimal : '0.30';

	    		if(!attack.image)attack.image = (function(){
		    		let finalImage;
	    			images.forEach(function(img){
		    			let type = img.src.split('/')[4].split('Medium')[0];
		    			
		    			if(type == weapon.type){
		    				finalImage = img;
		    				return;
		    			}
	    			});
	    			return finalImage;
	    		})();

	    		if(attack.isDying){
		    		if(!attack.chunks){
		    			let maxCount = 15;
		    			attack.chunks = [];
		    			attack.iterationsLeft = 17;

		    			for(let i = 0; i < maxCount; i++){
		    				attack.chunks.push({
		    					image:getImageChunk(attack.image),
		    					angle:Math.PI*2*i/maxCount,
		    				});
		    			}
		    		}

		    		attack.chunks.forEach(function(chunk, index){
		    			let x = (this.x + Math.cos(chunk.angle)*(40-attack.iterationsLeft*2)) - chunk.image.width/2;
		    			let y = (this.y + Math.sin(chunk.angle)*(40-attack.iterationsLeft*2)) - chunk.image.height/2;
		    			ctx.drawImage(chunk.image, x, y);
		    		}.bind(this));
		    		attack.iterationsLeft = attack.iterationsLeft - 1;

		    		if(attack.iterationsLeft < 0)delete this.attacks[attacker];
		    		continue;
		    	}

	    		if(localPlayer.discreteMode)break;
		    	
		    	ctx.drawImage(changeImageTransparency(attack.image, progressDecimal), this.x - attack.image.width/2, this.y - attack.image.height/2);
	    	}

	    	ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
	    	ctx.fillRect(this.x - 32*(this.health/this.maxHealth)/2, this.y + 13, 32*(this.health/this.maxHealth), 3);
	    	ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
	    	ctx.fillRect(this.x - 32*(this.armor/this.maxArmor)/2,   this.y + 16, 32*(this.armor/this.maxArmor), 3);

	    	ctx.font = '11px Roboto';
	    	let nameWidth = ctx.measureText(this.username).width;
	    	ctx.fillText(this.username, this.x - nameWidth/2, this.y - 14);
	    }

	    this.getSwing = function(targetX, targetY, rotation){
	    	function swing(targetX, targetY){//Class constructor
				//Variable declaration
				//Transformation stuff
				this.x = 0;
				this.y = 0;
				this.rotation = rotation || Math.atan2(targetY, targetX);
				//Radius
				this.radius = 0;//This is increased until it reaches maxRadius,
				this.maxRadius = 60;//At which point the swing fades away.
				this.radiusIncreaseRate = 7;//Increases radius, decreases until it reaches minimumRadIncRate,
				this.minimumRadIncRate = 5;//At which point it stops decreasing.
				//Aesthetics
				this.intensity = 0.3;//How transparent the edge of the swing is
			}

			var swing = new swing(targetX, targetY);
			//We make swing a class constructor for swing because that makes things easier:
			// we wrap it up in the above function so that we can have access to both scopes at once.

			//This code handles knockback for he who swung.
			function shouldBoostSpeed(speed, speedBoost, maxSpeed){//This is a quick lil' function that makes sure the knockback doesn't go too high.
				return (Math.abs(speed) > Math.abs(maxSpeed)) ? speed : speed+speedBoost;
			}
			this.speed.x = shouldBoostSpeed(this.speed.x, -0.35 * Math.cos(swing.rotation), -1.5 * Math.cos(swing.rotation));
			this.speed.y = shouldBoostSpeed(this.speed.y, -0.35 * Math.sin(swing.rotation), -1.5 * Math.sin(swing.rotation));

			this.swings.push(swing);//Add it to the list of strings so that it will be drawn and mathyfied.
    	};

    	this.calculateSwings = function(){
    		this.swings.forEach(function(swing){//Go through each swing
				if(swing.radius >= swing.maxRadius){//If it's done expanding,
					swing.intensity = swing.intensity - 0.05;//Start making it fade out
					swing.radius = swing.radius + 0.1;//This looks nice, but isn't neccessary.
					if(swing.intensity <= 0)this.swings.splice(this.swings.indexOf(swing), 1);//If it's faded out to nothing, we'll kill it.
					return;//Return because the code below is for a growing swing, not a dying one: we don't want it to be called
				}

				swing.radius = swing.radius + swing.radiusIncreaseRate;//Make it bigger
				swing.radiusIncreaseRate = (swing.radiusIncreaseRate - 0.5 < swing.minimumRadIncRate) ? swing.minimumRadIncRate : swing.radiusIncreaseRate - 0.5;//Make it get bigger more slowly, if needed
    		}.bind(this));
    	}

    	this.drawSwings = function(){
    		this.swings.forEach(function(swing){
	    		let gradient = ctx.createRadialGradient(swing.x, swing.y, swing.radius, swing.x, swing.y, 0);
	    		//Add pulsing bit here
	    		gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
	    		gradient.addColorStop(0.1, 'rgba(255, 0, 0, ' + swing.intensity + ')');
	    		gradient.addColorStop(0.2, 'rgba(255, 0, 0, ' + swing.intensity/10 + ')');
	    		gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0)');
	    		gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');

	    		ctx.fillStyle = gradient;

	    		ctx.save();//So that we can undo the rotation
	    		ctx.setTransform(1, 0, 0, 1, 0, 0);//Reset canvas

	    		ctx.translate(this.x - localPlayer.x, this.y - localPlayer.y);//This moves over to the player's location relative to the localhost's position, as not to skew things.
	    		ctx.translate(canvas.width/2, canvas.height/2);//So it's drawn in the middle

	    		ctx.rotate(swing.rotation);//Rotate over towards the mouse

	    		ctx.beginPath();//Begin drawing
	    		ctx.moveTo(swing.x, swing.y + 10);//These make the swing form a sort of trapezoid instead of a triangle
	    		ctx.lineTo(swing.x, swing.y - 10);//These make the swing form a sort of trapezoid instead of a triangle
	    		ctx.arc(swing.x, swing.y, swing.radius, Math.PI/10*-1, Math.PI/10);//This makes the curvy part on the end.

	    		ctx.fill();//Fill and end drawing

	    		ctx.restore();//Undo the rotation, so that everything else is drawn with a normal point of view.
    		}.bind(this));
    	}

		this.update = function(){//Just packages 
			this.calculate();//   calculate
			this.draw();//        and draw together.
			this.drawUI();
		}
    }



    //localPlayer variables
    var localPlayer = new player();//Local player is the one this client is controlling
    localPlayer.username = username;//We'll record his username.
    localPlayer.discreteMode = false;//If this is turned off, then the hotbar box that the player has selected doesn't go red.
    //Inventory variables
    localPlayer.inventoryOpenCoolDown = 0;//This helps make opening the inventory more smooth
    localPlayer.giveStuffPromptsOut = 0;//This records the amount of inventory prompts open
    localPlayer.inventory = {//This one lil' object right here holds all of the inventory data.
    	'equipped':{
    		displayNaturally:false,
    		inventory:{
    			'rock':undefined,
    			'paper':undefined,
    			'scissors':undefined
    		}
    	},
    	'paper bag':{
    		slots:5,
    		displayNaturally:true,
    		inventory:[]
    	}
    }

	localPlayer.keyMaps = {//So we'll give him some controls.
		'w':function(){//These could be outsourced to a more efficent function.
			localPlayer.speed.y = (localPlayer.speed.y - localPlayer.speedIncrease > localPlayer.maxSpeed*-1) ? localPlayer.speed.y - localPlayer.speedIncrease : localPlayer.maxSpeed*-1;
		},
		's':function(){//These could be outsourced to a more efficent function.
			localPlayer.speed.y = (localPlayer.speed.y + localPlayer.speedIncrease < localPlayer.maxSpeed) ? localPlayer.speed.y + localPlayer.speedIncrease : localPlayer.maxSpeed;
		},
        'd':function(){//These could be outsourced to a more efficent function.
        	localPlayer.speed.x = (localPlayer.speed.x + localPlayer.speedIncrease < localPlayer.maxSpeed) ? localPlayer.speed.x + localPlayer.speedIncrease : localPlayer.maxSpeed;	 
        },
		'a':function(){//These could be outsourced to a more efficent function.
			localPlayer.speed.x = (localPlayer.speed.x - localPlayer.speedIncrease > localPlayer.maxSpeed*-1) ? localPlayer.speed.x - localPlayer.speedIncrease : localPlayer.maxSpeed*-1;
		},
		'Enter':function(){//Enter has two purposes,
			if($('#chatInput').text() == '')$('#chatInput').focus();//Focusing in the chat, so you can type stuff into it
			else $('#sendButton').click();//Or sending what you've already typed in.
		},
		'left-button':function(){//Left button swings towards the mouse,
			if(localPlayer.swingRechargeCounter - Date.now() < 0){//If you've not already done so recently.
				localPlayer.swingRechargeCounter = Date.now() + localPlayer.swingRechargeTime;//This sets the next time that you can swing at.

				socket.emit('swingUpdate', currentMouseEvent.clientX - canvas.width/2, currentMouseEvent.clientY - canvas.height/2);//Send the swing to everyone else.
				localPlayer.getSwing(currentMouseEvent.clientX - canvas.width/2, currentMouseEvent.clientY - canvas.height/2);//And then record it for yourself.
				//The params tell the swing function where to point it's swing at.
			}
		},
		'q':function(){
			localPlayer.rotation = (localPlayer.rotation - 0.1);
		},
		'e':function(){
			localPlayer.rotation = (localPlayer.rotation + 0.1);
		},
		'f':function(){
			if(localPlayer.inventoryOpenCoolDown - Date.now() < 0){
				$('#playerInventory').toggle();
				localPlayer.inventoryOpenCoolDown = Date.now() + 100;
			}
		},
		' ':function(){
			if(localPlayer.swingRechargeCounter - Date.now() < 0){//If you've not already done so recently.
				localPlayer.swingRechargeCounter = Date.now() + localPlayer.swingRechargeTime;//This sets the next time that you can swing at.

				socket.emit('swingUpdate', 0, 0, localPlayer.rotation);//Send the swing to everyone else.
				localPlayer.getSwing(0, 0, localPlayer.rotation);//And then record it for yourself.
				//The params tell the swing function where to point it's swing at.
			}
		},
		'1':function(){
			for(var element in itemList){
				if(itemList[element].index == 0){
					$('#' + element).click();
					return;
				}
			}
		},
		'2':function(){
			for(var element in itemList){
				if(itemList[element].index == 1){
					$('#' + element).click();
					return;
				}
			}
		},
		'3':function(){
			for(var element in itemList){
				if(itemList[element].index == 2){
					$('#' + element).click();
					return;
				}
			}
		}
	};

	localPlayer.swingRechargeCounter = Date.now() + 1;//This keeps track of when you can swing and when you can't.
	localPlayer.swingRechargeTime = 20;//This is how long the space inbetween swings is.

	localPlayer.centerCamera = function(){
    	ctx.setTransform(1, 0, 0, 1, 0, 0);//Reset canvas
	    ctx.translate(localPlayer.x*-1 + canvas.width/2, localPlayer.y*-1 + canvas.height/2);//Goes to localPlayer coords, then half way up screen to center.
	    ctx.x = 0 - (localPlayer.x*-1 + canvas.width/2);//Resets ctx.x and records the previous translation
	    ctx.y = 0 - (localPlayer.y*-1 + canvas.height/2);//Same as above but for ctx.y
	    
	}

	localPlayer.centerCamera();
	callOnResize.push(localPlayer.centerCamera);//Put this in callOnResize, because we only need this to happen in the center of the screen moves

	localPlayer.drawUI = function(){
    	let counter = 0;
    	for(attacker in this.attacks){//Let's draw the attack count down bar.

    		counter = counter + 1;
    		let attack = this.attacks[attacker];

    		if(attack.isDying){
    			delete this.attacks[attacker];
    			continue;
    		}

    		let height = (canvas.height*0.85)*((Date.now() - attack.attackExpires)/10000);
    		let width = 25;
    		let x = ctx.x + canvas.width - 75*counter;
    		let y = ctx.y + canvas.height - 100;

    		function drawIt(){
    			ctx.beginPath();
    			ctx.moveTo(x, y);
    			ctx.lineTo(x + width, y);
    			ctx.lineTo(x + width, y + (height - height/5));
    			ctx.arc(x + width/2, y + (height - height/5), width/2, 0, Math.PI, true);
    			ctx.fill();
    		}

    		let otherColors = -1*Math.round(255*((Date.now() - attack.attackExpires)/10000));

    		let horizontalGrad = ctx.createLinearGradient(x, y, x+width, y);
    		horizontalGrad.addColorStop(0,   'rgba(255, ' + otherColors + ', ' + otherColors + ', 0)');
    		horizontalGrad.addColorStop(0.4, 'rgba(255, ' + otherColors + ', ' + otherColors + ', 0.2)');
    		horizontalGrad.addColorStop(0.6, 'rgba(255, ' + otherColors + ', ' + otherColors + ', 0.2)');
    		horizontalGrad.addColorStop(1,   'rgba(255, ' + otherColors + ', ' + otherColors + ', 0)');

    		let verticalGrad = ctx.createLinearGradient(x, y, x, y+height);
    		verticalGrad.addColorStop(0,     'rgba(255, ' + otherColors + ', ' + otherColors + ', 0.2)');
    		verticalGrad.addColorStop(1,     'rgba(255, ' + otherColors + ', ' + otherColors + ', 0.1)');

    		ctx.fillStyle = horizontalGrad;
    		drawIt();

    		ctx.fillStyle = verticalGrad;
    		drawIt();


    		ctx.fillStyle = 'gray';

    		ctx.font = '12px Roboto';
    		let heading = 'Attacked By:';
    		let headingWidth = ctx.measureText(heading).width;
    		ctx.fillText(heading, x + width/2 - headingWidth/2, y + 15);

    		ctx.font = '15px Roboto';
    		let attackerWidth = ctx.measureText(attacker).width;
    		ctx.fillText(attacker, x + width/2 - attackerWidth/2, y + 30);
    	};

    	ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    	ctx.fillRect(ctx.x + 10, ctx.y + canvas.height - 200, 295 * (this.health/this.maxHealth), 10);

    	ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    	ctx.fillRect(ctx.x + 10, ctx.y + canvas.height - 185, 295 * (this.armor/this.maxArmor), 10);
    }

	localPlayer.move = function(x, y){//Here we overwrite the move function so that the screen moves with the localPlayer.
		//Obviously we don't want them to keep moving if they're over the boundary, so

		if(this.x > maxDistance || this.x < -1*maxDistance || this.y > maxDistance || this.y < -1*maxDistance){
			if(this.x > maxDistance){
				x = -4;
				this.speed.x = x*2.5;
			}
			if(this.y > maxDistance){
				y = -4;
				this.speed.y = y*2.5;
			}
			if(this.x < maxDistance*-1){
				x = 4;
				this.speed.x = x*2.5;
			}
			if(this.y < maxDistance*-1){
				y = 4;
				this.speed.y = y*2.5;
			}
		}

		this.x = this.x + x;//Move the player.
		this.y = this.y + y;//Move the player.

	    ctx.translate(x*-1, y*-1);//Then the camera.
	    ctx.x = ctx.x + x;
	    ctx.y = ctx.y + y;
    }

    localPlayer.oldCalcSwings = localPlayer.calculateSwings;//First cache oldCalcSwings.
    localPlayer.calculateSwings = function(){//Then overwrite calculateSwings
    	this.oldCalcSwings();//But really just add onto it because we're still calling the old version.

    	//Here we'll loop through all of the swings to see if the player's being hit.
    	for(let playerIndex in otherPlayers){//We'll loop through all of the players,

    		if(localPlayer.health <= 0)break;//No use checking if we're dead.

    		let player = otherPlayers[playerIndex];//Cache each player for ease of access and efficiency

    		player.swings.forEach(function(swing){//Loop through each player's swings
    			let swingTip = {//Coordinates for the tip of the swing.
    				x:player.x + swing.radius * Math.cos(swing.rotation), //Uses cos to extrapolate the tip based on the swing's rotation
    				y:player.y + swing.radius * Math.sin(swing.rotation) //Uses sin to do the same.
    			}

    			if(swingTip.x > this.x - 16 && swingTip.x < this.x + 16 && swingTip.y > this.y - 16 && swingTip.y < this.y + 16){//If we're getting poked by the tip of the swing.
    				let attackStats = {};
    				attackStats.rotation = swing.rotation;
    				attackStats.startedAt = Date.now();
    				socket.emit('requestAttack', player.username, attackStats);
    			}

    		}.bind(this));

    	}
    }

    localPlayer.oldDamage = localPlayer.damage;//First, cache oldDamage
    localPlayer.damage = function(amount, dealtBy){//overwrite
    	if(localPlayer.health <= 0)return;//No need to kill what's already dead.
    	localPlayer.oldDamage(amount, dealtBy);//and then call oldDamage, so we're really just adding on
    	socket.emit('healthUpdate', localPlayer.health, dealtBy);//Update health for all
    }

    localPlayer.oldKill = localPlayer.kill;//Cache
    localPlayer.kill = function(dealtBy){//Overwrite
    	localPlayer.oldKill();//call cached, so we're just adding on
    	let keyMapsCache = this.keyMaps;

    	this.keyMaps = {};

    	setTimeout(() => {
    		this.keyMaps = keyMapsCache;

    		this.x = 0;
    		this.y = 0;
    		this.centerCamera();

    		this.health = this.maxHealth;
    		this.damage(0, dealtBy);
    	}, 10000);
    }



    localPlayer.initializeInventory = function(){
    	$('body').append('<div class = itemsPromptBox id = playerInventory></div>');
    	let outer = $('#playerInventory');
    	outer.append('<h3> Inventory </h3>');

    	let startCoords;
    	outer.on('mousedown', function(event){
    		startCoords = {
    			mouseX:event.pageX,
    			mouseY:event.pageY,
    			elementX:outer.position().left,
    			elementY:outer.position().top
    		}
    		outer.on('mousemove', function(event){
	    		outer.css('left', startCoords.elementX + (event.pageX - startCoords.mouseX));
	    		outer.css('top', startCoords.elementY + (event.pageY - startCoords.mouseY));

	    		event.stopPropagation();
    		}.bind(this));
    		return false;
    	});
    	outer.on('mouseup', function(){
    		outer.off('mousemove');
    	}.bind(this));


    	outer.append('<div class = x id = giveStuffXInventory >x</div>');
    	let x = $('#giveStuffXInventory');
    	x.on('click', function(event){
    		outer.hide();
    	});


    	outer.append('<div class = inner id = inventoryStuff></div>');
    	let stuff = $('#inventoryStuff');
    	stuff.on('mousedown', function(event){
    		event.stopPropagation();
    	});
    	stuff.css('width', '300px');


    	outer.append('<div class = inner id = inventoryDescriptor></div>');
    	let descriptor = $('#inventoryDescriptor');
    	descriptor.on('mousedown', function(event){
    		event.stopPropagation();
    	});
    	descriptor.css('margin-left', '10px');
    	descriptor.css('width', '200px');
    	
    	function fillStuff(){
    		stuff.empty();
    		for(let bagIndex in localPlayer.inventory){
    			let bag = localPlayer.inventory[bagIndex];
    			if(!bag.displayNaturally)return;

    			stuff.append('<h3>' + bagIndex + '</h3>');

    			bag.inventory.forEach(function(item){

    			});
    		}
    	}

    	function describe(){

    	}
    }
    localPlayer.initializeInventory();
    $('#playerInventory').hide();

    localPlayer.giveStuff = function(giverName, inventory, callBack){
    	this.giveStuffPromptsOut = this.giveStuffPromptsOut + 1;
    	
    	$('body').append('<div class = itemsPromptBox id = giveStuffPrompt' + this.giveStuffPromptsOut + '></div>');
    	let outer = $('#giveStuffPrompt' + this.giveStuffPromptsOut);
    	outer.append('<h3>' + giverName + '</h3>');
    	if(this.giveStuffPromptLastKnownCoords){
	    	outer.css('left', this.giveStuffPromptLastKnownCoords.x);
			outer.css('top', this.giveStuffPromptLastKnownCoords.y);
		}

    	let startCoords;
    	outer.on('mousedown', function(event){
    		startCoords = {
    			mouseX:event.pageX,
    			mouseY:event.pageY,
    			elementX:outer.position().left,
    			elementY:outer.position().top
    		}
    		outer.on('mousemove', function(event){
	    		outer.css('left', startCoords.elementX + (event.pageX - startCoords.mouseX));
	    		outer.css('top', startCoords.elementY + (event.pageY - startCoords.mouseY));

	    		event.stopPropagation();
    		}.bind(this));
    		return false;
    	});
    	outer.on('mouseup', function(){
    		outer.off('mousemove');
    		if(startCoords){
	    		this.giveStuffPromptLastKnownCoords = {
	    			x:startCoords.elementX + (event.pageX - startCoords.mouseX),
	    			y:startCoords.elementY + (event.pageY - startCoords.mouseY)
	    		}
    		}
    	}.bind(this));

    	
    	outer.append('<div class = x id = giveStuffX' + this.giveStuffPromptsOut + ' >x</div>');
    	let x = $('#giveStuffX' + this.giveStuffPromptsOut);
    	x.on('click', function(event){
    		outer.remove();
    		this.giveStuffPromptsOut = this.giveStuffPromptsOut - 1;
    		if(callBack)callBack();
    	});


    	outer.append('<div class = inner id = giveStuffInnerPrompt' + this.giveStuffPromptsOut + '></div>');
    	let inner = $('#giveStuffInnerPrompt' + this.giveStuffPromptsOut);
    	inner.on('mousedown', function(event){
    		event.stopPropagation();
    	});


    	outer.append('<div class = scroll></div>');


    	let inventoryNoDuplicates = {};
    	inventory.forEach(item => {

    		if(inventoryNoDuplicates[item.name])
    			inventoryNoDuplicates[item.name].quanity++;

    		else {
	    		item.quanity = 1;
	    		inventoryNoDuplicates[item.name] = item;
    		}
    	});

    	for(let itemShellIndex in inventoryNoDuplicates){
    		let itemShell = inventoryNoDuplicates[itemShellIndex];
    		inner.append('<div class = itemBox> <h3>' + itemShell.name.capitalize() + '</h3> </div>');
    		if(itemShell.quanity - 1)
    			inner.children().last().append('<h3 class = quanity>' + itemShell.quanity + '</h3>');
    	}
    }
    //End of code for localPlayer



    //Environment code

    var environment = [];

    var updateEnvironment = function(){
    	environment.forEach(function(mapItem){
    		mapItem.calculate();
    		mapItem.draw();
    	});
    }

    var mapItems = {
    	'teleporter':function(){
    		this.name = 'teleporter';
    		this.toolTip = "Woah, it's swirly! <br> It appears to bring forth refuse from another dimension... <br> Wait a minute! <br> Didn't I come out of there?";

    		this.onSpawn = function(){
    			this.radius = 300;
    			this.angle = Math.random()*(Math.PI*2);
    			this.colors = [[1, 23, 58], [1, 30, 76]];
    			this.rect = {
    				x:this.radius*-2,
    				y:this.radius*-2,
    				width:this.radius*4,
    				height:this.radius*4
    			}

    			let spawnAngle = Math.random()*(Math.PI*2);
    			localPlayer.speed.x = Math.cos(spawnAngle) * (this.radius*0.045);
    			localPlayer.speed.y = Math.sin(spawnAngle) * (this.radius*0.045);

    			this.swirls = (function(){
    				let swirls = [];
    				for(let i = 0; i < 100; i++){
    					swirls.push({
    						angle:Math.random()*(Math.PI*2),
    						coords:(function(){
    							let array = [];
    							let howMany = Math.round(Math.random()*5) + 2;
    							for(let i = 0; i < howMany; i++){
    								array.push([0, 0]);
    							}
    							return array;
    						})(),
    						distance:Math.round(Math.random()*(this.radius*3)) + this.radius,
    						turnRate:(Math.random()/15).toFixed(3)*1
    					});
    				}
    				return swirls;
    			}.bind(this))();
    			
    		};
    		this.calculate = function(){
    			this.mouseCalculate();

    			this.swirls.forEach(function(swirl){
    				swirl.angle = (swirl.angle + swirl.turnRate) % (Math.PI * 2);
    				let newCoordsX = Math.cos(swirl.angle) * swirl.distance;
    				let newCoordsY = Math.sin(swirl.angle) * swirl.distance;
    				swirl.coords.pop();
    				swirl.coords.unshift([newCoordsX, newCoordsY]);
    			}.bind(this));

    			this.angle = (this.angle + 0.001) % (Math.PI * 2);

    			if(Math.abs(localPlayer.x) < this.radius*3.2 && Math.abs(localPlayer.y) < this.radius*3.2){
    				let distanceFromCenter = Math.min(Math.sqrt(localPlayer.x*localPlayer.x + localPlayer.y*localPlayer.y), this.radius*3.2);
    				let angle = Math.atan2(localPlayer.y, localPlayer.x);
    				
    				localPlayer.speed.x = localPlayer.speed.x + Math.cos(angle) * (this.radius*3.2/500 - distanceFromCenter/500);
    				localPlayer.speed.x = (localPlayer.speed.x > 10) ? 10 : (localPlayer.speed.x < -10) ? -10 : localPlayer.speed.x;
    				
    				localPlayer.speed.y = localPlayer.speed.y + Math.sin(angle) * (this.radius*3.2/500 - distanceFromCenter/500);
    				localPlayer.speed.y = (localPlayer.speed.y > 10) ? 10 : (localPlayer.speed.y < -10) ? -10 : localPlayer.speed.y;
    				
    			}
    		};
    		this.draw = function(){

    			let orbGrad = ctx.createRadialGradient(this.x, this.y, this.radius*4, this.x, this.y, 0);
    			let colorsInside =  'rgba(' + this.colors[0][0] + ', ' + this.colors[0][1] + ', ' + this.colors[0][2] + ', ';
    			let colorsOutside = 'rgba(' + this.colors[1][0] + ', ' + this.colors[1][1] + ', ' + this.colors[1][2] + ', ';
    			orbGrad.addColorStop(1,   colorsInside + '1)');
    			orbGrad.addColorStop(0.5, colorsOutside + '1)');
    			orbGrad.addColorStop(0,   colorsOutside + '0)');

    			ctx.fillStyle = orbGrad;

    			ctx.beginPath();
    			ctx.arc(this.x, this.y, this.radius*4, 0, Math.PI*2);
    			ctx.fill();

    			ctx.strokeStyle = colorsInside + '0.35)';
    			this.swirls.forEach(function(swirl){
    				var lastPath = swirl.coords[0];
    				ctx.beginPath();
    				swirl.coords.forEach(function(coordSet, index){
    					
    					ctx.lineWidth = Math.ceil(7);
    					
    					ctx.moveTo(lastPath[0], lastPath[1]);
    					ctx.lineTo(coordSet[0], coordSet[1]);

    					lastPath = coordSet;
    				}.bind(this));
    				ctx.stroke();
    			}.bind(this));

    		};
    	},


    	'trash':function(){
    		this.name = 'trash';
    		this.toolTip = chooseFrom(["Smells... Interesting...", "One man's cliche is another pile of trash's tooltip.", "I suppose I'd best sift through this, it's not as if I have anything better to do.", "Trashy.", "Soggy cardboard... Yum.", "What do you mean you wish the tooltips were actually helpful? They have character!", "The tooltips that describe this item are much like that which they describe, in that their great quantity and shocking lack of quality make them appealing to only the most desperate of folk."]);

    		this.onSpawn = function(){
    			this.distance = 0;
    			this.coords = (function(){
    				var coords = [];
    				for(var i = 0; i < 50; i++){
    					coords.push([0, 0]);
    				}
    				return coords;
    			})();
    		}
    		this.calculate = function(){
    			let speed = Math.max(0.5, 10 * ((this.maxDistance - this.distance)/this.maxDistance).toFixed(2));
    			//speed = (this.speed > 1) ? this.speed : 1;

    			this.distance = this.distance + speed;
    			this.x = Math.cos(this.angle) * this.distance;
    			this.y = Math.sin(this.angle) * this.distance;

    			this.coords.pop();
    			this.coords.unshift([this.x, this.y]);

    			if(this.distance >= this.maxDistance || this.alreadyLoaded){//If we've moved our pile of debris out to where it needs to be, 
    				if(this.alreadyLoaded){
    					this.x = Math.cos(this.angle) * this.maxDistance;
    					this.y = Math.sin(this.angle) * this.maxDistance;
    				}

    				let image = newImages['debris'];

    				this.x = (this.x -  image.width/2).toFixed(0)*1;
    				this.y = (this.y - image.height/2).toFixed(0)*1;

    				this.rect = {
    					x:this.x,
    					y:this.y,
    					width:image.width,
    					height:image.height
    				}

    				this.calculate = function(){//this.calculate gets overwritten completely.
    					this.mouseCalculate();
    				}
    				this.draw = function(){//As does this.draw
    					ctx.drawImage(newImages['debris'], this.x, this.y);
    				}
    			}
    		};
    		this.draw = function(){
    			var gradient = ctx.createRadialGradient(this.x, this.y, 50, this.x, this.y, 0);
    			gradient.addColorStop(0, 'rgba(30, 30, 200, 0)');
    			gradient.addColorStop(1, 'rgba(30, 30, 200, 1)');

    			var trailGradient = ctx.createRadialGradient(this.x, this.y, 20, this.x, this.y, 200);
    			trailGradient.addColorStop(0, 'rgba(30, 30, 200, 0)');
    			trailGradient.addColorStop(1, 'rgba(30, 30, 200, 1)');

    			ctx.fillStyle = gradient;

    			ctx.beginPath();
    			ctx.arc(this.x, this.y, 50, 0, Math.PI*2);
    			ctx.fill();


    			ctx.strokeStyle = trailGradient;

    			this.coords.forEach(function(element, index){//Then we loop through each of the trailcoords,
		    		ctx.lineWidth = this.coords.length - index;//Set width of this section to the opposite of the section's index.
		    		ctx.beginPath();//Begin drawing

		    		let lastCoordsX = (this.coords[index-1]) ? this.coords[index-1][0] : this.x;//Set coordinates for the last part of the trail, if there aren't any, use the current coordinates.
		    		let lastCoordsY = (this.coords[index-1]) ? this.coords[index-1][1] : this.y;//Set coordinates for the last part of the trail, if there aren't any, use the current coordinates.

		    		ctx.moveTo(lastCoordsX, lastCoordsY);//Go to where the trail was last
		    		ctx.lineTo(element[0], element[1]);//Draw over to where it should be next

		    		ctx.stroke();//Draw and end drawing.
		    	}.bind(this));

		    	ctx.lineWidth = 1;//Set line width back to normal
    		};

    		this.onClick = function(){
    			if(this.open)return;
    			this.open = true;

    			localPlayer.giveStuff(this.name.capitalize(), this.inventory, function(){
    				this.open = false;
    			}.bind(this));
    		};
    	}
    }

    function mapItem(type){
    	mapItems[type].call(this);
    	//Here we assign universal default values
    	this.x = 0;
    	this.y = 0;

    	this.mouseCalculate = function(){//this does the math for hovering over things, and tooltips.
    		if(!currentMouseEvent || !this.rect)return;//If we don't know anything about the mouse, or where the mouse needs to be, we can't do mouse calculations.

			let x = currentMouseEvent.clientX + ctx.x;//This is a shortcut and small optimization.
			let y = currentMouseEvent.clientY + ctx.y;//This is a shortcut and small optimization.
			let rect = this.rect;//This is just a shortcut

			if((x > rect.x && x < rect.x + rect.width) && (y > rect.y && y < rect.y + rect.height)){//If the mouse is where it needs to be
				let toolTipBox = $('#toolTipBox');//This is a shortcut and an optimization, yet again.

				if(currentMouseEvent.toolTipper !== this && this.toolTipper){//If the mouse has moved, but hasn't left the rect,
					currentMouseEvent.toolTipper = this;//then claim that mouseEvent

					toolTipBox.css('left', currentMouseEvent.clientX);//And move the tooltip accordingly.
					toolTipBox.css('top', currentMouseEvent.clientY);//And move the tooltip accordingly.
				}

				if(currentMouseEvent.toolTipper == this){//If the tooltip's already been initialized,
					toolTipBox.show();//Make sure some nimwit hasn't hidden it,
					if(toolTipBox.height() < this.toolTipHeight)toolTipBox.height('+=5');//expand it if neccessary
					if(toolTipBox.width() < this.toolTipWidth)toolTipBox.width('+=5');//expand it if neccessary
					else if(toolTipBox.height() >= this.toolTipHeight)toolTipBox.contents().show();//And show the contents if neccessary.
				}

				else {//If the mouse is inside of the rect but the tooltip isn't initialized,
					//Claim it as so,
					currentMouseEvent.toolTipper = this;//this guy is for keeping track of if the mouse is inside of the rect.
					this.toolTipper = true;//And this guy is for keeping track of whether or not it's left the rect
					
					toolTipBox.show();//unhide,
					toolTipBox.empty();//And empty out the remnants of the last tooltip, if any

					toolTipBox.height('auto');//Let it expand as needed
					toolTipBox.width('auto');//Let it expand as needed

					toolTipBox.append('<h3 style = font-size:16px;>' + this.name.capitalize() + '</h3>');//Stick some content in there
					//toolTipBox.append('<hr>');
					toolTipBox.append('<p style = font-size:12px;>' + this.toolTip + '</p>');//Stick some content in there

					toolTipBox.css('left', currentMouseEvent.clientX);//Position it according to the mouse position
					toolTipBox.css('top', currentMouseEvent.clientY);//Position it according to the mouse position

					this.toolTipHeight = toolTipBox.height();//Record it's size as a full box
					this.toolTipWidth = toolTipBox.width();//Record it's size as a full box

					toolTipBox.height(0);//Make it tiny
					toolTipBox.width(0);//Make it tiny

					toolTipBox.contents().hide();//And hide it's innards.
				}

				if(this.onClick && pressedKeys['left-button'])this.onClick();//Lastly, if they click inside of this.rect, call the associated function.
			}
			else {//If the mouse is not where it needs to be,
				if(currentMouseEvent.toolTipper == this){//If we think we're in but we're not,
					$('#toolTipBox').hide();//Hide it,
					currentMouseEvent.toolTipper = undefined;//And record that we aren't inside of the rect
				}
				if(this.toolTipper)this.toolTipper = false;//Here too
			}
			

			if(!currentMouseEvent.toolTipper)$('#toolTipBox').hide();//Otherwise, we'll just hide it for good measure.
		}

    	//The onSpawn will define local default values, and other stuff that needs to happen upon the instantiation of the object.
    	if(this.onSpawn)this.onSpawn();
    }

    //This returns an object that has been turned into whatever the input object's .type is, with any other attributes inside of the input object assigned to the output object.
    function fleshOutMapObject(element){
		var elementCache = element;//We'll need a copy of the original input
		element = new mapItem(element.type);//Because we'll overwrite the original input

		for(let attribute in elementCache){//But then assign any of the attributes of the input object
			element[attribute] = elementCache[attribute];//to the fleshed out object.
		}
		return element;
	}

    //End of environment code


    
	//Network stuff
	var otherPlayers = {};//This keeps track of everyone else.

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
			return;
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
		environment = mapComplete;
	});

	socket.on('insertMapElement', function(element, index){
		environment.splice(index, 0, fleshOutMapObject(element));
	});

	socket.on('removeMapElement', function(index){
		environment.splice(index, 1);
	});

	socket.on('changeMapElement', function(index, attributeToChange, value){
		environment[index][attributeToChange] = value;
	});

	socket.on('callMapElementFunction', function(index, func, params){
		environment[index][func](...params);
	});

	//End of map stuff


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

		otherPlayers[attacker].latestWeapon = itemList[weapon];
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
    //var images = [];
	//const sources = ['imgs/rockMedium.png', 'imgs/paperMedium.png', 'imgs/scissorsMedium.png'];

	var commands = {
		'toggleDiscrete':function(){
			localPlayer.discreteMode = !localPlayer.discreteMode;
		},
		'justLikeJacob 1':function(){
			pressedKeys[' '] = true;
			pressedKeys['q'] = true;
		}
	}
	
    var itemList = {
    	'rock':{
    		name:'rock',
    		type:'rock',
    		img:'imgs/rockBig.png',
    		weakness:'paper',
    		damageHP:60,
    		damageArmor:20,
    		accuracy:10,
    		deflectionPercentage:70, //amount of damage negated by armor
    		behavior:'basic',
    		onSuccessfulAttack:function(looser, winner, attackStats){
    			if(looser == localPlayer){
	    			looser.armor = looser.armor - this.damageArmor + (Math.round(Math.random()*this.accuracy) - this.accuracy);
	    			looser.armor = (looser.armor < 0) ? 0 : looser.armor;
	    			looser.damage(this.damageHP + (Math.round(Math.random()*this.accuracy) - this.accuracy), winner.username);
	    			socket.emit('statUpdate', 'armor', looser.armor);
	    		}
    		}
    	},
    	'paper':{
    		name:'paper',
    		type:'paper',
    		img:'imgs/paperBig.png',
    		weakness:'scissors',
    		armorBoost:30,
    		behavior:'basic',
    		onSuccessfulAttack:function(looser, winner, attackStats){
    			if(winner == localPlayer){
	    			winner.armor = (winner.armor + this.armorBoost > winner.maxArmor) ? winner.maxArmor : winner.armor + this.armorBoost;
	    			socket.emit('statUpdate', 'armor', winner.armor);
    			}
    		}
    	},
    	'scissors':{
    		name:'scissors',
    		type:'scissors',
    		img:'imgs/scissorsBig.png',
    		weakness:'rock',
    		damageHP:20,
    		damageArmor:60,
    		accuracy:5,
    		deflectionPercentage:0, //Amount of damage negated by armor
    		behavior:'basic',
    		onSuccessfulAttack:function(looser, winner, attackStats){
    			if(looser == localPlayer){
	    			looser.armor = looser.armor - this.damageArmor + (Math.round(Math.random()*this.accuracy) - this.accuracy);
	    			looser.armor = (looser.armor < 0) ? 0 : looser.armor;
	    			looser.damage(this.damageHP + (Math.round(Math.random()*this.accuracy) - this.accuracy), winner.username);
	    			socket.emit('statUpdate', 'armor', looser.armor);
	    		}
    		}
		}
	};/*,
		//crafting misc.
		'soiled cloth':{

		},
		'cardboard':{

		},
		//crafting base materials
		'can':{

		},
		'magicked wax':{

		},
		//base material manipulators
		'laser lighter':{

		},
		'magical needle':{

		},
		//crafting tier two craftable bases
		'long metal pipe':{

		},
		'short metal pipe':{

		},
		'waxen frame':{

		},
		'waxen tendrils':{

		},
		//crafting tier two craftable ammunition
		'metal shard':{

		},
		'metal ball':{

		},
		'metal plate':{

		},
		'waxen blade':{

		},
		'waxen glob':{

		},
		'waxen slab':{

		},
		//crafting teir two findables
		'kinetic accelerator':{

		},
		'tapped rune':{

		},
		//crafting teir two weapons
		'popper':{//short pipe, KA

		},
		'blaster':{//three short pipes, 2 KA

		},
		'boomer':{//long pipe, KA

		},
		'rifle':{//long pipe, 6 short pipes, 3 KA

		},
		'tendril scepter':{//three tendril, TR

		},
		'tendril loop':{//five tendril, TR

		},
		'tendril trident':{//tendril frame, three tendril, TR

		},
		'tendril launcher':{//tendril frame, seven tendril, 2 TR

		}*/

    var itemBehaviors = {
    	'basic':function(victim, attacker, attackStats){

    		if((attacker.isFighting.indexOf(victim.username) + 1)){
    			return;
    		}

    		function cleanUp(){
    			[victim, attacker].forEach(function(player, index){
    				let otherPlayer = [victim, attacker][(index == 0) ? 1 : 0];
	    			player.latestWeapon = undefined;

	    			if(player.attacks[otherPlayer.username]){
	    				player.attacks[otherPlayer.username].isDying = true;
	    				clearTimeout(player.attacks[otherPlayer.username].onExpiration);
	    			}

	    			setTimeout(function(){
			    		player.isFighting.splice(player.isFighting.indexOf(otherPlayer), 1);
		    		}.bind(this), 1000);
	    		}.bind(this));
    		}

			victim.speed.x = 7*Math.cos(attackStats.rotation);
			victim.speed.y = 7*Math.sin(attackStats.rotation);

			attacker.isFighting.push(victim.username);//Maybe integrate the isFighting system and the victim.attacks?
			attacker.swings = [];
			

			if(victim.latestWeapon){//If our attack is a response to the second attack
				if(victim.latestWeapon.type == this.weakness){
					//If the victim's weapon type is our weakness, then we'd loose, so when we 
					victim.latestWeapon.onSuccessfulAttack(attacker, victim, attackStats);
					//send the attack info to the victim's weapon, we'll put attacker first because the attacker is the looser.
				}
				else if(this.type == victim.latestWeapon.weakness){
					//If our weapon type is the victim's weakness, then we'd win, so when we
					this.onSuccessfulAttack(victim, attacker, attackStats);
					//send the attack info to our weapon, we'll put the victim's name first because they're the looser.
				}

				cleanUp();//If they respond, no matter what they responded with, then their attack will stop expiring: this mini battle is over.
			}

			else {//Or if we're the first one to attack in this battle
				attackStats.attackExpires = attackStats.startedAt + 10000;//Set an expiry date for our attack,
				//so if they don't make a reposte by then, they're going to lose the fight.

				attackStats.onExpiration = setTimeout(function(){//And if they haven't made a reposte by then,
					this.onSuccessfulAttack(victim, attacker, attackStats);
					//We'll tell our weapon that, and put their name first to signify that they lost.
					cleanUp();//And then end the battle.
				}.bind(this), Date.now() - attackStats.startedAt + 10000);

				attackStats.weapon = this.name;
				victim.attacks[attacker.username] = attackStats;//We'll record this attack in the victim's attacks
			}
		}
    };

    for(let itemName in itemList){
    	let item = itemList[itemName];
    	item.onHit = itemBehaviors[item.behavior]
    }
    localPlayer.currentWeapon = itemList['rock'];


    var getUI = function(){
    	let counter = 0;

	    for(let elementName in itemList){
	    	let element = itemList[elementName];
			element.index = counter;

			$('#' + elementName).remove();

			$('body').append('<div id = ' + elementName + ' class = hotBarBox style=left:' + (canvas.width*0.8 - Object.keys(itemList).length*40 + element.index*80) + 'px; > <img src = ' + element.img + '> </div>');
			let elmtDiv = $('#' + elementName);
			if(elementName == localPlayer.currentWeapon.name && !localPlayer.discreteMode){
				elmtDiv.css('border-color', 'rgba(255, 0, 0, 0.115)');
				elmtDiv.css('background-color', 'rgba(255, 0, 0, 0.1)');
			}

			function refresh(){
				elmtDiv.html('<img src = ' + element.img + '>');
			}

			elmtDiv.on('mouseenter', function(){
				elmtDiv.empty();
				elmtDiv.append('<h2>' + (element.index + 1) + '</h2>');
				setTimeout(refresh, 500);
			});
			elmtDiv.on('click', function(){
				localPlayer.currentWeapon = element;
				getUI();
			});
			elmtDiv.on('mouseleave', refresh);

			counter = counter + 1;
		}
	}
	getUI();
	callOnResize.push(getUI);
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

        ctx.strokeRect((maxDistance+5)*-1, (maxDistance+5)*-1, (maxDistance+5)*2, (maxDistance+5)*2);

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

        updateEnvironment();//This draws the map elements

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