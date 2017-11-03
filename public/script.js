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
const sources = ['imgs/rockMedium.png', 'imgs/paperMedium.png', 'imgs/scissorsMedium.png'];

//Universal Functions. 
//Generally speaking, the more simple the function, the higher up in the script it is.

function chooseFrom(anArray){ //This function chooses something from an array.
  return anArray[Math.floor(Math.random() * anArray.length)];
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

	$(document).on('click', function checkForButtons(event){//And then add logic for the clicking of the buttons,
		buttons.forEach(function(button){//By looping through each of them,

			var bDim = button.dimensions;//And setting their dimensions as a variable, for ease of access.

			if(event.clientX  >  bDim.x  &&  event.clientX  <  bDim.x + bDim.width  &&  event.clientY  >  bDim.y  &&  event.clientY  <  bDim.y + bDim.height){
				if(button.onClick){//Notice that we're testing to see if the function exists, not if it returns true.

					//These functions give the next function in the chain some ability to control the start screen.
                    var cleanUp = function(){//This function ties up the loose ends that exist for the start screen.
						startScreenOn = false//Stop updating the screen, to kill it.
	                    $(document).off("click", checkForButtons);//Stop checking for buttons/
	                    callOnResize = [];//And clear the functions that are for resizing the start screen, since there is no start screen.
                	};

                	//These functions give the next function in the chain some ability to control the start screen.
                	var cleanUpButtons = function(){
                		$(document).off("click", checkForButtons);//This turns off this function's parent function.
                	};

                	//These functions give the next function in the chain some ability to control the start screen.
                	var reviveButtons = function(){
                		$(document).on("click", checkForButtons);//This turns this function's parent function back on.
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

    var maxDistance = 700;


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
    		var trailCoords = [];
    		for(var i = 0; i < 15; i++)trailCoords.push([0, 0]);
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

    	//Health values
    	this.health = 100;
    	this.maxHealth = this.health;

    	this.armor = this.health/4;
    	this.maxArmor = this.maxHealth/2;

    	this.keyMaps = {};//This stores all of the user input logic.
    	this.canAttack = true;
    	
    	//Attack values
    	this.currentWeapon = undefined;//Once items are defined, this is set to a rock.
    	this.hasLaunchedAttack = false;
    	this.launchedAttackWith = undefined;

    	this.damage = function(amount, dealtBy){
    		if(this.health < 0)return;//Because there's no use in killing that which is already dead.

    		this.health = this.health - amount;//Knock off however much health needs to be knocked off.

    		if(this.health < 0)this.kill(dealtBy);//Boom! ya ded!

    		this.intensityMax = (this.intensityDifference) + (this.intensityMaxDefault - this.intensityDifference)*(this.health/this.maxHealth);
    		//The above line makes the player's color less intense if they've been damaged, but not so much that they become entirely invisible.
    		this.intensityMin = this.intensityMax - this.intensityDifference;//And then we'll adjust these to fit intensityMax
    		this.intensity = this.intensityMin;//And then we'll adjust these to fit intensityMax
    	};

    	this.kill = function(dealtBy){
    		this.health = this.maxHealth;
    	}

    	this.launchAttack = function(targetUsername, attackStats){//STAB THEM!
    		this.hasLaunchedAttack = true;
    		this.latestWeapon = this.currentWeapon;
    		socket.emit('launchAttack', targetUsername, this.latestWeapon.name, attackStats);
    		otherPlayers[targetUsername].getAttacked(localPlayer, attackStats);
    	}

    	this.getAttacked = function(attacker, attackStats){
    		var weapon = attacker.latestWeapon;
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

	        for(var keyMap in this.keyMaps)if(pressedKeys[keyMap]){//Loop through the record of pressed keys.
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

	    		var lastCoordsX = (this.trailCoords[index-1]) ? this.trailCoords[index-1][0] : this.x;//Set coordinates for the last part of the trail, if there aren't any, use the current coordinates.
	    		var lastCoordsY = (this.trailCoords[index-1]) ? this.trailCoords[index-1][1] : this.y;//Set coordinates for the last part of the trail, if there aren't any, use the current coordinates.

	    		ctx.moveTo(lastCoordsX, lastCoordsY);//Go to where the trail was last
	    		ctx.lineTo(element[0], element[1]);//Draw over to where it should be next

	    		ctx.stroke();//Draw and end drawing.
	    	}.bind(this));

	    	ctx.lineWidth = 1;//Set line width back to normal

	    	//Now we draw the actual player.
	    	var gradient = ctx.createRadialGradient(this.x, this.y, 16, this.x, this.y, 0);//Set his gradient,
	    	gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');//Make him clear in the middle
	    	gradient.addColorStop(1, 'rgba(255, 0, 0, ' + this.intensity + ')');//use his intensity towards the edges

	    	ctx.fillStyle = gradient;//Use the aforementioned gradient.

	    	ctx.beginPath();//Start drawing him
	    	ctx.arc(this.x, this.y, 16, 0, 2*Math.PI);//Draw him as a big ole' circle.

	    	ctx.fill();//Fill him in and finish drawing.


	    	var armorGradient = ctx.createRadialGradient(this.x, this.y, 16, this.x, this.y, 0);
	    	armorGradient.addColorStop(0, 'rgba(150, 150, 150, ' + this.armor/this.maxArmor + ')');
	    	armorGradient.addColorStop(1, 'rgba(150, 150, 150, 0)');

	    	ctx.fillStyle = armorGradient;//Use the aforementioned gradient.

	    	ctx.beginPath();//Start drawing him
	    	ctx.arc(this.x, this.y, 16, 0, 2*Math.PI);//Draw him as a big ole' circle.

	    	ctx.fill();//Fill him in and finish drawing.
	    }

	    this.getSwing = function(targetX, targetY, rotation){
	    	if(!this.canAttack)return;
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
	    		var gradient = ctx.createRadialGradient(swing.x, swing.y, swing.radius, swing.x, swing.y, 0);
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
		}
    }



    //localPlayer variables
    var localPlayer = new player();//Local player is the one this client is controlling
    localPlayer.username = username;//We'll record his username.
    localPlayer.outlineCurrentWeapon = true;//If this is turned off, then the hotbar box that the player has selected doesn't go red.
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
    	for(var playerIndex in otherPlayers){//We'll loop through all of the players,
    		var player = otherPlayers[playerIndex];//Cache each player for ease of access and efficiency

    		player.swings.forEach(function(swing){//Loop through each player's swings
    			var swingTip = {//Coordinates for the tip of the swing.
    				x:player.x + swing.radius * Math.cos(swing.rotation), //Uses cos to extrapolate the tip based on the swing's rotation
    				y:player.y + swing.radius * Math.sin(swing.rotation) //Uses sin to do the same.
    			}

    			if(swingTip.x > this.x - 16 && swingTip.x < this.x + 16 && swingTip.y > this.y - 16 && swingTip.y < this.y + 16){//If we're getting poked by the tip of the swing.
    				var attackStats = {};
    				attackStats.rotation = swing.rotation;
    				socket.emit('requestAttack', player.username, attackStats);
    			}

    		}.bind(this));

    	}
    }

    localPlayer.oldDamage = localPlayer.damage;//First, cache oldDamage
    localPlayer.damage = function(amount, dealtBy){//overwrite
    	if(localPlayer.health < 0)return;//No need to kill what's already dead.
    	localPlayer.oldDamage(amount, dealtBy);//and then call oldDamage, so we're really just adding on
    	socket.emit('healthUpdate', localPlayer.health, dealtBy);//Update health.
    }

    localPlayer.kill = function(dealtBy){
    	var keyMapsCache = this.keyMaps;

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


    
	//Network stuff
	var otherPlayers = {};//This keeps track of everyone else.

    //Chat stuff
    $('body').append('<div id = chatBox></div>');//This makes the chat box
    $('body').append('<div id = sendBox></div>');//This makes the chat box
    $('#sendBox').append('<div id="chatInput" contenteditable=true></div>');//This makes the chat box
    $('#sendBox').append('<div id = sendButton>Send</div>');//This makes the chat box

    socket.on('chatMessage', function(username, data){//On reception of chat message
		$('#chatBox').append('<span style = color:darkgrey;>' + '<span style = color:gray;font-weight:bold;>[' + username + ']</span> ' + data + "<br/>" + '</span>');
		//Put the chat message in the onscreen box.

		//And then cut out some chat messages if chat is too full.
		var contentHeight = 0;//To do that, first record how full the box is.
		$('#chatBox').children().each(function(){//Then go through each item in the box,
			contentHeight = contentHeight + $(this).height();//Add it's height to the counter.
		});
		//And then, for each row that exceeds the chat's limit, remove one chat message from the top.
		for(var contentHeight = contentHeight; contentHeight > 125; contentHeight = contentHeight - 18)$('#chatBox').children().first().remove();
	});

    $('#sendButton').on('click', function(event){
		event.preventDefault();//Just in case there's some built in thingymobob that will get in our way.
		var message = $('#chatInput').text();//Get the message
		if(message === '')return;//Don't bother sending if it's spammy.
		$('#chatInput').text('');//Reset the chat input
		socket.emit('messages', message);//And then send the message to the server, who will then broadcast it to everyone else.
	 });
    //End of chat stuffs


	socket.emit('join');//Tell the server that we've entered a username and are now trying to play the game.

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
	
    var itemList = {
    	'rock':{
    		name:'rock',
    		type:'rock',
    		img:'imgs/rockBig.png',
    		weakness:'paper',
    		damageHP:30,
    		damageArmor:0,
    		accuracy:10,
    		deflectionPercentage:70, //amount of damage negated by armor
    		behavior:'basic',
    		onSuccessfulAttack:function(victim, attacker, attackStats){
    			victim.damage(this.damageHP + (Math.round(Math.random()*this.accuracy) - this.accuracy));
    		}
    	},
    	'paper':{
    		name:'paper',
    		type:'paper',
    		img:'imgs/paperBig.png',
    		weakness:'scissors',
    		armorBoost:15,
    		behavior:'basic',
    		onSuccessfulAttack:function(victim, attacker, attackStats){
    			victim.armor = (victim.armor + this.armorBoost > victim.maxArmor) ? maxArmor : victim.armor + this.armorBoost;
    			console.log(victim.armor);
    		}
    	},
    	'scissors':{
    		name:'scissors',
    		type:'scissors',
    		img:'imgs/scissorsBig.png',
    		weakness:'rock',
    		damageHP:0,
    		damageArmor:30,
    		accuracy:5,
    		deflectionPercentage:0, //Amount of damage negated by armor
    		behavior:'basic',
    		onSuccessfulAttack:function(victim, attacker, attackStats){
    			victim.armor = victim.armor - this.damageArmor + (Math.round(Math.random()*this.accuracy) - this.accuracy)
    		}
		}
    }

    var itemBehaviors = {
    	'basic':function(victim, attacker, attackStats){
			victim.speed.x = 7*Math.cos(attackStats.rotation);
			victim.speed.y = 7*Math.sin(attackStats.rotation);

			attacker.canAttack = false;
			setTimeout(function(){
				attacker.canAttack = true;
			}, 1000);

			if(victim.latestWeapon && victim.latestWeapon.name == this.weakness){
				victim.latestWeapon.onSuccessfulAttack(victim, attacker, attackStats);

				victim.latestWeapon = undefined;
				attacker.latestWeapon = undefined;
			}
		}
    };

    for(var itemName in itemList){
    	var item = itemList[itemName];
    	item.onHit = itemBehaviors[item.behavior]
    }
    localPlayer.currentWeapon = itemList['rock'];


    var getUI = function(){
    	var counter = 0;

		function check(elementName){
			var element = itemList[elementName];
			element.index = counter;

			$('#' + elementName).remove();

			$('body').append('<div id = ' + elementName + ' class = hotBarBox style=left:' + (canvas.width*0.8 - Object.keys(itemList).length*40 + element.index*80) + 'px; > <img src = ' + element.img + '> </div>');
			var elmtDiv = $('#' + elementName);

			if(elementName == localPlayer.currentWeapon.name && localPlayer.outlineCurrentWeapon){
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

	    for(var elementName in itemList){
	    	check(elementName);
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
        for(var y = ctx.y - (localPlayer.y % 32); y < ctx.y + canvas.height; y = y + 32){
        	//The modulus part makes it look like the grid follows the player. The rest just draws a line each 32 pixels.
    		ctx.beginPath();//Begin path
    		ctx.moveTo(ctx.x, y);//Start on the left
    		ctx.lineTo(ctx.x + canvas.width, y);//And slide across the screen.
    		ctx.stroke();//Stroke and close the path.
    		ctx.closePath();//Stroke and close the path.
        }

        //vertical lines
        for(var x = ctx.x - (localPlayer.x % 32); x < ctx.x + canvas.width; x = x + 32){
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


	onkeydown = onkeyup = function(e){
		e = e || event; //to deal with IE //Although nothing else is IE proof... :D

		if(e.key == 'Enter')e.preventDefault();//If it's enter, we don't need the weird default logic for that to be run.

		pressedKeys[e.key] = e.type == 'keydown';//Record either the release of this key, or the press of this key. This allows us to not only call things when keys are pressed, but call things for as long as they are.
	}

	$(document).on('keydown keyup', onkeydown);//Call that handy lil' function we defined a few lines up.
	$(document).on('mousedown mouseup', function(event){
		var buttonNameArray = ['left-button', 'middle-button', 'right-button'];
		//This records all of the names of buttons that we can tell are being pressed, the index aligns with the number each button is assigned.
		pressedKeys[buttonNameArray[event.button]] = event.type == 'mousedown';
		//That way, we can record the state of the button under it's name, instead of just some vague number.
		currentMouseEvent = event;//This way we can access the mouse's information from anywhere in the program.
		if(event.type == 'mousedown')$(document).on('mousemove', function(event){//This keeps the mouse's position updated when it moves and the left-button is held down.
			currentMouseEvent = event;//As you can see here, where we overwrite the currentMouseEvent.
		});
		else $(document).off('mousemove');//But if the mouse isn't being held down, we don't need the information(right now, maybe we'll record the mousemovement no matter what later)
	});


    var animationLoop = function(){//This function is the glue that holds all of the other guys together
        if(isPaused)return;//Stop if the game is paused.
        
        drawBackground();//This draws the background
        localPlayer.update();//We update the local player first,

        for(var playerIndex in otherPlayers){//And then we loop through the record of everyone he's player with,
        	otherPlayers[playerIndex].update();//and update each of them.
        }
        
        requestAnimationFrame(animationLoop);//And then it calls itself again.
    }
    
    animationLoop();//This starts the animation loop.
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