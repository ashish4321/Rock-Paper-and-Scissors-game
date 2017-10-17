var canvas;//  We'll define these
var ctx;//	   guys later.

var primaryColor   = '#005dff';
var secondaryColor = '#81aaef';


//Universal Functions. 
//Generally speaking, the more simple the function, the higher up in the script it is.


function adjustScreen(){

	canvas.width  = $(window).width();//Get the screen's width to fill all available space.
	canvas.height = $(window).height();//Get the screen's height to fill all available space.

}

function chooseFrom(anArray){ //This function chooses something from an array.
  return anArray[Math.floor(Math.random() * anArray.length)];
}


function startScreen(){
	var indexOfBigLetter = 0;
	var bigLetterSizeBonus = 0;
	var bigLetterSizeBonusChangeRate = 10;
	const titleText = 'Rock Paper Scissors';

	var images = [];
	var sources = ['imgs/rockMedium.png', 'imgs/paperMedium.png', 'imgs/scissorsMedium.png'];
	var items = [];

	sources.forEach(function(element){
		var image = new Image();

		image.onload = function(){
			images.push(image);
		}

		image.src = element;
	});


	var paintGradient = function(){
		var diagonalGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
		//define bounds for gradient

		diagonalGradient.addColorStop(0, primaryColor);//Define first color stop
		diagonalGradient.addColorStop(1, secondaryColor);//Define second color stop

		ctx.fillStyle = diagonalGradient;// 			   Set the gradient as our brush
		ctx.fillRect(0, 0, canvas.width, canvas.height);// and slop it onto the screen.

	};

	var paintTitle = function(){
		var fontSize = canvas.width/15;
		ctx.font = fontSize + 'px Modak';//define font

		var textDim = ctx.measureText(titleText);	 	//We'll need the text's dimensions to position it correctly.
		textDim.x = canvas.width/2 - textDim.width/2;	//Here we calculate the x (center)
		textDim.y = canvas.height/3;					//and the y (top 3rd of the page)

		var textGradient = ctx.createLinearGradient(textDim.x, textDim.y, textDim.x+textDim.width, textDim.y);
		//bounds for gradient

		textGradient.addColorStop(0,   'dimgray');
		textGradient.addColorStop(0.5, 'gray');
		textGradient.addColorStop(1,   'dimgray');
		//These three color stops should make the text appear kind of shiny.

		var currentX = textDim.x;
		//Curent x will keep track of where our next letter should be drawn.

		ctx.fillStyle = textGradient;

		for(var letterIndex = 0; letterIndex < titleText.length; letterIndex++){
			var letter = titleText[letterIndex];

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
			//ctx.strokeText(titleText, textDim.x, textDim.y);

			ctx.font = fontSize + 'px Modak';

			currentX = currentX + ctx.measureText(letter).width;
		}

	};

	var paintItems = function(){
		if(images.length !== sources.length)return;

		for(var x = 0; x < 6; x++){
			for(var heightUsed = 0; heightUsed < (canvas.height+32); heightUsed = heightUsed + 32){
				items.push({
					image:chooseFrom(images), //just a random image of rock, paper, or scissors.
					y:heightUsed + (Math.round(Math.random()*20)-10), //32 is height of medium image
					x:((x>2) ? canvas.width-canvas.width/25-(32*(x-3)) : canvas.width/25 - (32*(x-1))) + (Math.round(Math.random()*20)-10),
					rot:0,
					descentVelocity:Math.round(Math.random()*5)+1
				})
			}
		}

		paintItems = function(){
			items.forEach(function(item){
				item.y = item.y + item.descentVelocity;
				if(item.y > canvas.height)item.y = -32;
				ctx.drawImage(item.image, item.x, item.y);
			});
		}
	};

	var animateScreen = function(){
		paintGradient();
		paintItems();
		paintTitle();

		requestAnimationFrame(animateScreen);

	};

	animateScreen();

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