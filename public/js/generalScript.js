//Universal Functions. 
//Generally speaking, the more simple the function, the higher up in the script it is.

function chooseFrom(anArray){ //This function chooses something from an array.
  return anArray[Math.floor(Math.random() * anArray.length)];
}

String.prototype.capitalize = function(){
	return this.replace(/\b\w/g, l => l.toUpperCase())
}

String.prototype.camelize = function(){
	return this.charAt(0).toLowerCase() + this.capitalize().replace(/\s/g, '').slice(1);
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

var commands = {
	'toggleDiscreet':function(){
		localPlayer.discreetMode = !localPlayer.discreetMode;
	},
	'justLikeJacob 1':function(){
		pressedKeys[' '] = true;
		pressedKeys['q'] = true;
	}
}