var canvas;//  We'll define these
var ctx;//	   guys later.

//Background variables
var primaryColor   = '#282828';
var secondaryColor = '#505050';
var backgroundGradient;//This guy is the gradient for the background.

//These are called on the screen's resize.
var callOnResize = [];


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

    	intensity:0.4,
    	intensityChangeRate:0.005,
    	intensityMax:0.8,
    	intensityMin:0.4,

    	speed:{
    		x:0,
    		y:0
    	},
    	maxSpeed:5,
    	speedIncrease:0.5,
    	speedDecrease:0.25,

    	keyMaps:{
    		'w':function(){
    			player.speed.y = (player.speed.y - player.speedIncrease < player.maxSpeed*-1) ? player.speed.y - player.speedIncrease : player.maxSpeed*-1;
    		}
    	}
    }
    
    var getGradients = function(){
    	mapGrad = ctx.createRadialGradient(ctx.x + canvas.width/2, ctx.y + canvas.height/2, canvas.height, ctx.x + canvas.width/2, ctx.y + canvas.height/2, 0);
        mapGrad.addColorStop(0, primaryColor);
        //mapGrad.addColorStop(0.9, 'dimgray');
        mapGrad.addColorStop(1, secondaryColor);

        gridGrad = ctx.createRadialGradient(ctx.x + canvas.width/2, ctx.y + canvas.height/2, canvas.height, ctx.x + canvas.width/2, ctx.y + canvas.height/2, 0);
        gridGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gridGrad.addColorStop(1, 'rgba(255, 255, 255, 0.03');
        
    }
    
    var drawBackground = function(){

    	getGradients();

        ctx.fillStyle = mapGrad;
        
        ctx.fillRect(ctx.x, ctx.y, canvas.width, canvas.height);

        ctx.strokeStyle = gridGrad;

        for(var y = ctx.y; y < ctx.y + canvas.height; y = y + 32){
    		ctx.beginPath();
    		ctx.moveTo(ctx.x, y);
    		ctx.lineTo(ctx.x + canvas.width, y);
    		ctx.stroke();
    		ctx.closePath();
        }

        for(var x = ctx.x; x < ctx.x + canvas.width; x = x + 32){
    		ctx.beginPath();
    		ctx.moveTo(x, ctx.y);
    		ctx.lineTo(x, ctx.y + canvas.height);//Swap x and canvas.height and something really weird happens.
    		ctx.stroke();
    		ctx.closePath();
        }
    }


    var drawPlayer = function(){
    	var playerGradient = ctx.createRadialGradient(player.x, player.y, 16, player.x, player.y, 0);
    	playerGradient.addColorStop(0, 'rgba(255, 255, 0, 0)');
    	playerGradient.addColorStop(1, 'rgba(255, 255, 0, ' + player.intensity + ')');

    	player.intensity = player.intensity + player.intensityChangeRate;
    	if(player.intensity > player.intensityMax)player.intensityChangeRate = player.intensityChangeRate * -1;
    	else if(player.intensity < player.intensityMin)player.intensityChangeRate = player.intensityChangeRate * -1;


    	ctx.fillStyle = playerGradient;

    	ctx.beginPath();
    	ctx.arc(player.x, player.y, 16, 0, 2*Math.PI);

    	ctx.fill();

    }

    function centerCameraOnPlayer(){
	    ctx.translate(player.x + canvas.width/2, player.y + canvas.height/2);
	    ctx.x = 0 - (player.x + canvas.width/2);
	    ctx.y = 0 - (player.y + canvas.height/2);
	    
	}

	centerCameraOnPlayer();
	callOnResize.push(centerCameraOnPlayer);

	var calculatePlayer = function(){
		player.x = player.x + player.speed.x;
		player.y = player.y + player.speed.y;

		if(player.speed.x > 0)player.speed.x = (player.speed.x - player.speedDecrease > 0) ? player.speed.x - player.speedDecrease : 0;
		else if(player.speed.x < 0)player.speed.x = (player.speed.x + player.speedDecrease < 0) ? player.speed.x + player.speedDecrease : 0;

		if(player.speed.y > 0)player.speed.y = (player.speed.y - player.speedDecrease > 0) ? player.speed.y - player.speedDecrease : 0;
		else if(player.speed.y < 0)player.speed.y = (player.speed.y + player.speedDecrease < 0) ? player.speed.y + player.speedDecrease : 0;
	}



	$(document).on('keydown', function(event){
		for(var element in player.keyMaps){
			if(element == event.key)player.keyMaps[element]();
		}
	});


    var animationLoop = function(){
        if(isPaused)return;
        
        drawBackground();
        calculatePlayer();
        drawPlayer();
        
        requestAnimationFrame(animationLoop);
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