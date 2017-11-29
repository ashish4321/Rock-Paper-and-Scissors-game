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
	this.currentHotbarSelection = undefined;//Once items are defined, this is set to rock.
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
		this.latestWeapon = this.currentHotbarSelection;

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
    		if(!attack.isDying && localPlayer.discreetMode)break;
    		
    		let weapon = item.get(this.attacks[attacker].weapon);
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

    		if(localPlayer.discreetMode)break;
	    	
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



//localPlayer function
function getLocalPlayer(username){
	var localPlayer = new player();//Local player is the one this client is controlling
	localPlayer.username = username;//We'll record his username.
	localPlayer.discreetMode = false;//If this is turned off, then the hotbar box that the player has selected doesn't go red.
	//Inventory variables
	localPlayer.inventoryOpenCoolDown = 0;//This helps make opening the inventory more smooth
	localPlayer.giveStuffPromptsOut = 0;//This records the amount of inventory prompts open
	localPlayer.inventory;//This one lil' object right here will hold all of the inventory data, once it gets it from the server.
	localPlayer.currentHotbarSelection = item.get('rock');
	localPlayer.interactables = [];

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
		' ':function(){
			if(localPlayer.swingRechargeCounter - Date.now() < 0){//If you've not already done so recently.
				localPlayer.swingRechargeCounter = Date.now() + localPlayer.swingRechargeTime;//This sets the next time that you can swing at.

				socket.emit('swingUpdate', 0, 0, localPlayer.rotation);//Send the swing to everyone else.
				localPlayer.getSwing(0, 0, localPlayer.rotation);//And then record it for yourself.
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
				localPlayer.updateInventory();
				localPlayer.inventoryOpenCoolDown = Date.now() + 500;
			}
		},
		'r':function(){//if they press c
			if(currentMouseEvent){//and if we know where the mouse is
				localPlayer.interactables.forEach(mapItem => {//For everything that has a .rect, a .onInteract, and wants to have stuff done to it on click,
					let x = currentMouseEvent.clientX + ctx.x;//this is a shortcut and small optimization.
					let y = currentMouseEvent.clientY + ctx.y;//this is a shortcut and small optimization.
					let rect = mapItem.rect;//this is just a shortcut

					if((x > rect.x && x < rect.x + rect.width) && (y > rect.y && y < rect.y + rect.height))//if the mouse is inside of this element's rect
						mapItem.onInteract();//call that elements interact function
				});
			}
		},
		'1':function(){
		},
		'2':function(){
		},
		'3':function(){
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

				let weapon = item.get(this.attacks[attacker].weapon);

				if(!attack.image)
					attack.image = newImages['icons/' + weapon.type];

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
		ctx.fillRect(ctx.x + 10, ctx.y + canvas.height - 185, 295 * (this.health/this.maxHealth), 10);

		ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
		ctx.fillRect(ctx.x + 10, ctx.y + canvas.height - 200, 295 * (this.armor/this.maxArmor), 10);
	}

	localPlayer.move = function(x, y){//Here we overwrite the move function so that the screen moves with the localPlayer.
		//Obviously we don't want them to keep moving if they're over the boundary, so

		if(this.x > environment.maxDistance || this.x < -1*environment.maxDistance || this.y > environment.maxDistance || this.y < -1*environment.maxDistance){
			if(this.x > environment.maxDistance){
				x = -4;
				this.speed.x = x*2.5;
			}
			if(this.y > environment.maxDistance){
				y = -4;
				this.speed.y = y*2.5;
			}
			if(this.x < environment.maxDistance*-1){
				x = 4;
				this.speed.x = x*2.5;
			}
			if(this.y < environment.maxDistance*-1){
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

			descriptor.append('<div class = inventoryTopTab id = equippedTab> Equipped </div>');
			descriptor.append('<div class = inventoryTopTab id = descriptionsTab> Descriptions </div>');


		
		localPlayer.updateInventory = function(){
			socket.emit('requestInventoryData', this.username);

			socket.on('recieveInventoryData', (username, inventory) => {
				if(username === this.username){
					stuff.empty();
					this.inventory = inventory;

					for(let bagIndex in this.inventory){
						let bag = this.inventory[bagIndex];

						if(Array.isArray(bag.inventory)){
							
							stuff.append('<h4 style = color:rgba(' + bag.color + ',0.6); >' + bagIndex.capitalize() + '</h4>');
							stuff.append('<hr style = border-color:rgba(' + bag.color + ',0.2);>');

							for(let i = 0; i < bag.slots; i++){
								stuff.append('<div id = ' + bagIndex.camelize() + 'Slot' + i + ' class = itemBox></div>');

								let itemBox = $('#' + bagIndex.camelize() + 'Slot' + i);
								let bagItem = bag.inventory[i];

								itemBox.css('border', '3px solid rgba(186,186,186,0.15)');//set the border's default color

								if(bagItem){
									itemBox.append('<img src = imgs/icons/' + bagItem.name.camelize() + '.png >');//put the image in
									itemBox.css('border', '3px solid rgba(' + bagItem.color + ',0.2)');//overwrite the default border assigned above with the border specified in the item's object

									itemBox.append('<h4 class = quanity style = color:rgba(' + bag.color + ',0.6);>' + bagItem.quanity + '</h4>');
								}
							}

							stuff.append('<hr style = border-color:rgba(' + bag.color + ',0.2);>');
						}
					}

					descriptor.append('');
				}
			});
		}
	}

	localPlayer.initializeInventory();
	$('#playerInventory').hide();



	localPlayer.giveStuff = function(giverName, giver, inventory, callBack){
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

			socket.removeListener('recieveInventoryData', onRecieveData);

			if(callBack)callBack();
		});


		outer.append('<div class = inner id = giveStuffInnerPrompt' + this.giveStuffPromptsOut + '></div>');
		let inner = $('#giveStuffInnerPrompt' + this.giveStuffPromptsOut);
		inner.on('mousedown', function(event){
			event.stopPropagation();
		});


		//outer.append('<div class = scroll></div>');

		function displayInventory(){
			//Close the prompt if the inventory is empty
			if(inventory.length === 0)x.click();

			//first clean the inventory, stacking up duplicates
			let inventoryNoDuplicates = {};
			inventory.forEach(entry => {

				if(inventoryNoDuplicates[entry.name])
					inventoryNoDuplicates[entry.name].quanity++;

				else {
		    		inventoryNoDuplicates[entry.name] = item.get(entry.name);
		    		inventoryNoDuplicates[entry.name].quanity = 1;
				}
			});

			//once it's clean, then display it
			for(let itemShellIndex in inventoryNoDuplicates){
				let itemShell = inventoryNoDuplicates[itemShellIndex];
				inner.append('<div class = itemBox> <img src = /imgs/icons/' + itemShell.name.charAt(0).toLowerCase() + itemShell.name.capitalize().replace(/\s/g, '').slice(1) + '.png > <h3>' + itemShell.name.capitalize() + '</h3> </div>');
				
				let itemHTML = inner.children().last();

				itemHTML.css('border', '3px solid ' + 'rgba(' + itemShell.color + ',0.2)');//turn border right color
				itemHTML.children().last().css('color', 'rgba(' + itemShell.color + ',0.8)');//and turn title right color

				if(itemShell.quanity - 1)
					itemHTML.append('<h3 class = quanity>' + itemShell.quanity + '</h3>');

				itemHTML.click(event => {
					socket.emit('takeItem', environment.map.indexOf(giver), itemShell.name);
				});
			}
		}

		let onRecieveData = function(index, newInventory){
			if(index === environment.map.indexOf(giver)){
				inventory = newInventory;
				inner.empty();
				displayInventory();
			}
		}

		socket.on('recieveInventoryData', onRecieveData);
	}

	return localPlayer;
	//End of code for localPlayer
}