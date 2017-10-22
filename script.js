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


function startScreen(){
	//On or off variable
	var startScreenOn = true;

	//Title variables
	var indexOfBigLetter = 0;
	var bigLetterSizeBonus = 0;
	var bigLetterSizeBonusChangeRate = 10;
	const titleText = 'Rock Paper Scissors';

	//Waterfall of items variables
	var images = [];
	const sources = ['imgs/rockMedium.png', 'imgs/paperMedium.png', 'imgs/scissorsMedium.png'];
	var items = [];

	//Buttons variables. Right now they just contain a name, and some code to run when they're clicked, but later they will get bounding rects that allow them to be clicked.
	const buttons = [
		{
			name:'Adventure',
			onClick:startAdventure
		},
		{
			name:'Change Save',
			onClick:undefined
		},
		{
			name:'New Save',
			onClick:undefined
		},
		{
			name:'Information',
			onClick:undefined
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

	var animateScreen = function(){

		if(!startScreenOn)return;

		paintGradient();
		paintItems();
		paintTitle();
		paintButtons();

		requestAnimationFrame(animateScreen);

	};

	animateScreen();

	$(document).on('click', function checkForButtons(event){
		buttons.forEach(function(button){
			var bDim = button.dimensions;
			if(event.clientX  >  bDim.x  &&  event.clientX  <  bDim.x + bDim.width  &&  event.clientY  >  bDim.y  &&  event.clientY  <  bDim.y + bDim.height){
				if(button.onClick){//Notice that we're testing to see if the function exists, not if it returns true.
                    //Cleanup:
                    //Code cleanup
					startScreenOn = false
                    $(document).off("click", checkForButtons);
                    callOnResize = [];
                    
                    //Aesthetic Cleanup
                    paintGradient();
                    
                    //Cleanup done.
                    //Calling function for this button:
					button.onClick();
				}
			}
		});
	});

}



function startAdventure(){
    //boolean, if it's off the loop goes off.
    var isPaused = false;
    
    //Map variables
    var mapDim;
    var mapGrad;
    var gridGrad;
    
	//Player variables
    var player = {
    	x:0,
    	y:0,
    	trailCoords:(function(){
    		var trailCoords = [];
    		for(var i = 0; i < 15; i++)trailCoords.push([0, 0]);
    		return trailCoords;
    	})(),

    	intensity:0.8,
    	intensityChangeRate:0.005,
    	intensityMax:1,
    	intensityMin:0.8,

    	speed:{
    		x:0,
    		y:0
    	},
    	maxSpeed:7,
    	speedIncrease:0.5,
    	speedDecrease:0.05,

    	keyMaps:{
    		'w':function(){
    			player.speed.y = (player.speed.y - player.speedIncrease > player.maxSpeed*-1) ? player.speed.y - player.speedIncrease : player.maxSpeed*-1;
    		},
    		's':function(){
    			player.speed.y = (player.speed.y + player.speedIncrease < player.maxSpeed) ? player.speed.y + player.speedIncrease : player.maxSpeed;
    		},
            'd':function(){
            	player.speed.x = (player.speed.x + player.speedIncrease < player.maxSpeed) ? player.speed.x + player.speedIncrease : player.maxSpeed;	 
            },
			'a':function(){
    			player.speed.x = (player.speed.x - player.speedIncrease > player.maxSpeed*-1) ? player.speed.x - player.speedIncrease : player.maxSpeed*-1;
    		},
    		'left-button':function(){
    			if(player.swingRechargeCounter - Date.now() < 0){
    				player.swingRechargeCounter = Date.now() + player.swingRechargeTime;
    				player.swings.push(new swing(currentMouseEvent.clientX - canvas.width/2, currentMouseEvent.clientY - canvas.height/2));
    			}
    		}
    	},

    	swings:[],
    	swingRechargeCounter:Date.now() + 1,
    	swingRechargeTime:20
    }
    
    var getGradients = function(){
    	mapGrad = ctx.createRadialGradient(ctx.x + canvas.width/2, ctx.y + canvas.height/2, canvas.height, ctx.x + canvas.width/2, ctx.y + canvas.height/2, 0);
        mapGrad.addColorStop(0, primaryColor);
        //mapGrad.addColorStop(0.9, 'dimgray');
        mapGrad.addColorStop(1, secondaryColor);

        gridGrad = ctx.createRadialGradient(ctx.x + canvas.width/2, ctx.y + canvas.height/2, canvas.height, ctx.x + canvas.width/2, ctx.y + canvas.height/2, 0);
        gridGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gridGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1');
        
    }
    
    var drawBackground = function(){

    	getGradients();

        ctx.fillStyle = mapGrad;
        
        ctx.fillRect(ctx.x, ctx.y, canvas.width, canvas.height);

        ctx.strokeStyle = gridGrad;

        //Vertical lines
        for(var y = ctx.y - (player.y % 32); y < ctx.y + canvas.height; y = y + 32){
    		ctx.beginPath();
    		ctx.moveTo(ctx.x, y);
    		ctx.lineTo(ctx.x + canvas.width, y);
    		ctx.stroke();
    		ctx.closePath();
        }

        //Horizontal lines
        for(var x = ctx.x - (player.x % 32); x < ctx.x + canvas.width; x = x + 32){
    		ctx.beginPath();
    		ctx.moveTo(x, ctx.y);
    		ctx.lineTo(x, ctx.y + canvas.height);//Swap x and canvas.height and something really weird happens.
    		ctx.stroke();
    		ctx.closePath();
        }
    }


    var drawPlayer = function(){
    	
    	player.swings.forEach(function(element){
    		element.draw();
    	});

    	trailGradient = ctx.createRadialGradient(player.x, player.y, 125, player.x, player.y, 0);
    	trailGradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
    	trailGradient.addColorStop(0.85, 'rgba(255, 0, 0, ' + player.intensity/4 + ')');
    	trailGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    	
    	ctx.strokeStyle = trailGradient;

    	player.trailCoords.forEach(function(element, index){
    		ctx.lineWidth = player.trailCoords.length - index;
    		ctx.beginPath();

    		var lastCoordsX = (player.trailCoords[index-1]) ? player.trailCoords[index-1][0] : player.x;
    		var lastCoordsY = (player.trailCoords[index-1]) ? player.trailCoords[index-1][1] : player.y;

    		ctx.moveTo(lastCoordsX, lastCoordsY);
    		ctx.lineTo(element[0], element[1]);

    		ctx.stroke();
    	});

    	ctx.lineWidth = 1;

    	var playerGradient = ctx.createRadialGradient(player.x, player.y, 16, player.x, player.y, 0);
    	playerGradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
    	playerGradient.addColorStop(1, 'rgba(255, 0, 0, ' + player.intensity + ')');

    	player.intensity = player.intensity + player.intensityChangeRate;
    	if(player.intensity > player.intensityMax)player.intensityChangeRate = player.intensityChangeRate * -1;
    	else if(player.intensity < player.intensityMin)player.intensityChangeRate = player.intensityChangeRate * -1;


    	ctx.fillStyle = playerGradient;

    	ctx.beginPath();
    	ctx.arc(player.x, player.y, 16, 0, 2*Math.PI);

    	ctx.fill();

    }

	function swing(targetX, targetY){
		//Variable declaration
		//Transformation stuff
		this.x = 0;
		this.y = 0;
		this.rotation = Math.atan2(targetY, targetX);
		//Radius
		this.radius = 0;//This is increased until it reaches maxRadius,
		this.maxRadius = 60;//At which point the swing fades away.
		this.radiusIncreaseRate = 7;//Increases radius, decreases until it reaches minimumRadIncRate,
		this.minimumRadIncRate = 5;//At which point it stops decreasing.
		//Aesthetics
		this.intensity = 0.3;//How transparent the edge of the swing is

		movePlayer(-5 * Math.cos(this.rotation), -5 * Math.sin(this.rotation));

		this.calculate = function(){
			if(this.radius >= this.maxRadius){//This'll fade out, and eventually remove the swing once it's done expanding
				this.intensity = this.intensity - 0.05;
				this.radius = this.radius + 0.1;
				if(this.intensity <= 0)player.swings.splice(player.swings.indexOf(this), 1);
				return;
			}

			this.radius = this.radius + this.radiusIncreaseRate;
			this.radiusIncreaseRate = (this.radiusIncreaseRate - 0.5 < this.minimumRadIncRate) ? this.minimumRadIncRate : this.radiusIncreaseRate - 0.5;
		};

    	this.draw = function(){
    		this.calculate();

    		var gradient = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, 0);
    		//Add pulsing bit here
    		gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    		gradient.addColorStop(0.1, 'rgba(255, 0, 0, ' + this.intensity + ')');
    		gradient.addColorStop(0.2, 'rgba(255, 0, 0, ' + this.intensity/10 + ')');
    		gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0)');
    		gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');

    		ctx.fillStyle = gradient;

    		ctx.save();
    		ctx.setTransform(1, 0, 0, 1, 0, 0);//Reset canvas
    		ctx.translate(canvas.width/2, canvas.height/2);
    		ctx.rotate(this.rotation);

    		ctx.beginPath();
    		ctx.moveTo(this.x, this.y + 10);
    		ctx.lineTo(this.x, this.y - 10);
    		ctx.arc(this.x, this.y, this.radius, Math.PI/10*-1, Math.PI/10);

    		ctx.fill();

    		ctx.restore();
    	};

    }

    function centerCameraOnPlayer(){
    	ctx.setTransform(1, 0, 0, 1, 0, 0);//Reset canvas
	    ctx.translate(player.x*-1 + canvas.width/2, player.y*-1 + canvas.height/2);//Goes to player coords, then half way up screen to center.
	    ctx.x = 0 - (player.x*-1 + canvas.width/2);//Resets ctx.x and records the previous translation
	    ctx.y = 0 - (player.y*-1 + canvas.height/2);//Same as above but for ctx.y
	    
	}

	centerCameraOnPlayer();
	callOnResize.push(centerCameraOnPlayer);

	var calculatePlayer = function(){
		player.trailCoords.splice(player.trailCoords.length - 1, 1);
		player.trailCoords.unshift([player.x, player.y]);

		player.lastX = player.x;
		player.lastY = player.y;

		movePlayer(player.speed.x, player.speed.y);

        for(var keyMap in player.keyMaps)if(pressedKeys[keyMap])player.keyMaps[keyMap]();

		if(player.speed.x > 0)player.speed.x = ((player.speed.x - player.speedDecrease) > 0) ? player.speed.x - player.speedDecrease : 0;
		else if(player.speed.x < 0)player.speed.x = ((player.speed.x + player.speedDecrease) < 0) ? player.speed.x + player.speedDecrease : 0;

		if(player.speed.y > 0)player.speed.y = ((player.speed.y - player.speedDecrease) > 0) ? player.speed.y - player.speedDecrease : 0;
		else if(player.speed.y < 0)player.speed.y = ((player.speed.y + player.speedDecrease) < 0) ? player.speed.y + player.speedDecrease : 0;
	}

	function movePlayer(x, y){//And the camera too.
		player.x = player.x + x; 
		player.y = player.y + y;
        
        ctx.translate(x*-1, y*-1);
        ctx.x = ctx.x - x*-1;
        ctx.y = ctx.y - y*-1;

	}


	onkeydown = onkeyup = function(e){
		e = e || event; //to deal with IE //Although nothing else is IE proof... :D

		pressedKeys[e.key] = e.type == 'keydown';
	}

	$(document).on('keydown keyup', onkeydown);
	$(document).on('mousedown mouseup', function(event){
		var buttonNameArray = ['left-button', 'middle-button', 'right-button']
		pressedKeys[buttonNameArray[event.button]] = event.type == 'mousedown';
		currentMouseEvent = event;
		if(event.type == 'mousedown')$(document).on('mousemove', function(event){
			currentMouseEvent = event;
		});
		else $(document).off('mousemove');
	});


    var animationLoop = function(){//This function is the glue that holds all of the other guys together
        if(isPaused)return;//Stop if the game is paused.
        
        calculatePlayer();//This does the math for the player's actions
        drawBackground();//This draws the background
        drawPlayer();//This draws the player
        
        requestAnimationFrame(animationLoop);//And then it calls itself again.
    }
    
    animationLoop();
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