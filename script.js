    var canvas;//  We'll define these
var ctx;//	   guys later.

//Background variables
var primaryColor   = '#005dff';
var secondaryColor = '#81aaef';
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
	backgroundGradient.addColorStop(0, primaryColor);//Define first color stop
	backgroundGradient.addColorStop(1, secondaryColor);//Define second color stop

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
    //isOn boolean
    var isPaused = false;
    
    //Map variables
    var mapDim;
    var mapGrad;
    var gridGrad;
    
    //Sidebar variables
    var sideBarDim;
    
    var getDimensions = function(){
        mapDim = {//Map dimensions
            width:canvas.width - canvas.width/5, //The map takes up 4/5 of the screen.
            height:canvas.height, //The map takes up the entire height of the screen.
            x:0,//And starts in the left,
            y:0//top portion of the screen.
        }
        
        mapGrad = ctx.createRadialGradient(mapDim.x + mapDim.width*0.5, mapDim.y + mapDim.height/2, (mapDim.height < mapDim.width) ? mapDim.height : mapDim.width, mapDim.x + mapDim.width*0.5, mapDim.y + mapDim.height/2, 0);
        mapGrad.addColorStop(0, 'gray');
        //mapGrad.addColorStop(0.9, 'dimgray');
        mapGrad.addColorStop(1, 'dimgray');

        gridGrad = ctx.createRadialGradient(mapDim.x + mapDim.width*0.5, mapDim.y + mapDim.height/2, (mapDim.height < mapDim.width) ? mapDim.height : mapDim.width, mapDim.x + mapDim.width*0.5, mapDim.y + mapDim.height/2, 0);
        gridGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gridGrad.addColorStop(1, 'rgba(255, 255, 255, 0.03');

        sideBarDim = {
            x:mapDim.x+mapDim.width, //So it starts where the mapDim leaves off
            y:0, //Drawn from the top down
            height:canvas.height, //Takes up the entire page.
            width:canvas.width/5 //Takes up the width the map left for 'em.
        }
        
    }
    
    callOnResize.push(getDimensions);
    getDimensions();
    
    
    var drawBackground = function(){
        ctx.fillStyle = mapGrad;
        
        ctx.fillRect(mapDim.x, mapDim.y, canvas.width, mapDim.height);

        for(var y = 0; y < canvas.height; y = y + 32){
    		ctx.strokeStyle = gridGrad;

    		ctx.beginPath();
    		ctx.moveTo(0, y);
    		ctx.lineTo(canvas.width, y);
    		ctx.stroke();
    		ctx.closePath();
        }

        for(var x = 0; x < canvas.width; x = x + 32){
    		ctx.strokeStyle = gridGrad;

    		ctx.beginPath();
    		ctx.moveTo(x, 0);
    		ctx.lineTo(x, canvas.height);//Swap x and canvas.height and something really weird happens.
    		ctx.stroke();
    		ctx.closePath();
        }
    }
    
    var drawSideBar = function(){
        ctx.strokeStyle = 'darkgray';
        ctx.lineWidth = 4;
        ctx.globalAlphaa = 0.3;
        
        ctx.beginPath();
        ctx.moveTo(sideBarDim.x, sideBarDim.y);
        ctx.lineTo(sideBarDim.x, sideBarDim.y + sideBarDim.height);
        ctx.stroke();
        
        ctx.fillStyle = 'darkgray';
        ctx.globalAlpha = 0.2;
        
        ctx.fillRect(sideBarDim.x, sideBarDim.y, sideBarDim.width, sideBarDim.height);
        
        ctx.globalAlpha = 1;
    }
    
    var makeSideBarHTML = function(){
        $('body').append('<div id = sideBar style = position:fixed;left:' + sideBarDim.x + 'px;top:' + sideBarDim.y + 'px;width:' + sideBarDim.width + 'px;height:' + sideBarDim.height + 'px;></div>');
        
        $('#sideBar').append(
            '<h1>Inventory</h1>' +
            '<hr>'
        );
    }
    
    var killSideBarHTML = function(){
        $('#sideBar').remove();
    }
    
    var updateSideBarHTML = function(){
        killSideBarHTML();
        makeSideBarHTML();
    }
    
    makeSideBarHTML();
    
    callOnResize.push(updateSideBarHTML);
    
    var animationLoop = function(){
        if(isPaused)return;
        
        drawBackground();
        drawSideBar();
        
        requestAnimationFrame(animationLoop);
    }
    
    animationLoop();
}

//End of Universal Functions



//Here'll be where we throw together all of our previously defined abstractions.
$(document).ready(function(){
	canvas = document.getElementById('gameCanvas');//Now that these guys have been loaded in,
	ctx = canvas.getContext('2d');//				 we'll initialize them.

	adjustScreen();

	$(window).on('resize', function(){
		adjustScreen();
	});

	startScreen();
});