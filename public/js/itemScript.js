var item = {
	get:function(type){}
};



(function(){
	var itemList = {
		'rock':function(){
			this.slot = 'rock';
			this.type = 'rock';
			this.img = 'imgs/rockBig.png';
			this.weakness = 'paper';
			this.damageHP = 60;
			this.damageArmor = 20;
			this.accuracy = 10;
			this.deflectionPercentage = 70; //amount of damage negated by armor;
			this.behavior = 'basic';
			this.onSuccessfulAttack = function(looser, winner, attackStats){
				if(looser == localPlayer){
	    			looser.armor = looser.armor - this.damageArmor + (Math.round(Math.random()*this.accuracy) - this.accuracy);
	    			looser.armor = (looser.armor < 0) ? 0 : looser.armor;
	    			looser.damage(this.damageHP + (Math.round(Math.random()*this.accuracy) - this.accuracy), winner.username);
	    			socket.emit('statUpdate', 'armor', looser.armor);
	    		}
			};
			this.color = '186, 186, 186';
			this.description = "Dude, this thing really rocks!";
		},
		'paper':function(){
			this.slot = 'paper';
			this.type = 'paper';
			this.img = 'imgs/paperBig.png';
			this.weakness = 'scissors';
			this.armorBoost = 30;
			this.behavior = 'basic';
			this.onSuccessfulAttack = function(looser, winner, attackStats){
				if(winner == localPlayer){
	    			winner.armor = (winner.armor + this.armorBoost > winner.maxArmor) ? winner.this.maxArmor : winner.armor + this.armorBoost;
	    			socket.emit('statUpdate', 'armor', winner.armor);
				}
			};
			this.color = '186, 186, 186';
			this.description = "Thin, but not nearly as much so as the plot of this game.";
		},
		'scissors':function(){
			this.slot = 'scissors';
			this.type = 'scissors';
			this.img = 'imgs/scissorsBig.png';//This is just for the hotbar, the inventory icon is generated using the name.
			this.weakness = 'rock';
			this.damageHP = 20;
			this.damageArmor = 60;
			this.accuracy = 5;
			this.deflectionPercentage = 0, //Amount of damage negated by armor
			this.behavior = 'basic';
			this.onSuccessfulAttack = function(looser, winner, attackStats){
				if(looser == localPlayer){
	    			looser.armor = looser.armor - this.damageArmor + (Math.round(Math.random()*this.accuracy) - this.accuracy);
	    			looser.armor = (looser.armor < 0) ? 0 : looser.armor;
	    			looser.damage(this.damageHP + (Math.round(Math.random()*this.accuracy) - this.accuracy), winner.username);
	    			socket.emit('statUpdate', 'armor', looser.armor);
	    		}
			};
			this.color = '186, 186, 186';
			this.description = "Don't run.";
		},
		//crafting misc.
		'soiled rag':function(){
			this.slot = 'paper';
			this.type = 'paper';
			this.weakness = 'scissors';
			this.accuracy = 5;
			this.damageHP = -30;
			this.behavior = 'basic';
			this.onSuccessfulAttack = function(looser, winner, attackStats){
				looser.damage(this.damageHP + (Math.round(Math.random()*this.accuracy) - this.accuracy), winner.username);
			};
			this.color = '186, 186, 186';
			this.description = "Just ignore the rancid smell and wrap the cloth around your wounds.";
		},
		'cardboard':function(){
			this.color = '186, 186, 186';
			this.description = "Makes wonderful houses, as I'm sure you already know.";
		},
		//crafting base materials
		'can':function(){
			this.color = '186, 186, 186';
			this.description = "It's not uncanny. In fact, it's quite the opposite.";
		},
		'magicked wax':function(){
			this.color = '186, 186, 186';
			this.description = "I'm not sure how it's made, but it definitely smells magical. I think I'm going to need a magical needle in order to sow it into anything useful.";
		},
		//base material manipulators
		'laser welder':function(){
			this.color = '89,244,66';
			this.description = "The nuclear battery in this tool has seen quite a few half-lives, but I'm sure it will still be able to weld cans together.";
		},
		'magical needle':function(){
			this.color = '89,244,66';
			this.description = "Of course wax is sewn, how could you not know that?";
		},
		//crafting tier two craftable bases
		'long metal pipe':function(){
			this.color = '255,255,0';
			this.description = "A hollow stick of tetanus.";
		},
		'short metal pipe':function(){
			this.color = '255,255,0';
			this.description = "It's not even shiny...";
		},
		'waxen frame':function(){
			this.color = '255,255,0';
			this.description = "Yes, I used the adjective waxen.";
		},
		'waxen tendril':function(){
			this.color = '255,255,0';
			this.description = "At least it's not a tentacle. 'Cuz... you know... eww.";
		},
		//crafting tier two craftable ammunition/
		/*
		'metal shard':function(){

		},
		'metal ball':function(){

		},
		'metal plate':function(){

		},
		'waxen blade':function(){

		},
		'waxen glob':function(){

		},
		'waxen slab':function(){

		},
		*/
		//crafting teir two findables
		'kinetic accelerator':function(){
			this.color = '89,244,66';
			this.description = "Ooo, a fancy piece of technology that I found in a trash can. It's probably malfunctioning, so I should use it to make a handheld weapon!";
		},
		'tapped rune':function(){
			this.color = '89,244,66';
			this.description = "A small rune that buzzes with destructive power. I wonder why it got thrown away... It is safe, right?";
		},
		//crafting teir two weapons
		/*
		'popper':function(){//short pipe, KA
			this.description = "A shoddy pipe wrought from rusty cans guards the user from the destructive powers of a peice of technology that is either low on power or malfunctioning. Cool!"
		},
		'blaster':function(){//three short pipes, 2 KA

		},
		'boomer':function(){//long pipe, KA

		},
		'rifle':function(){//long pipe, 6 short pipes, 3 KA

		},
		*/
		'scepter':function(){//three tendril, TR
			this.color = '89,244,66';
			this.description = 'Fancy stick... of destruction!';
		},
		//'loop':function(){//five tendril, TR

		//},
		'trident':function(){//tendril frame, three tendril, TR
			this.color = '89,244,66';
			this.description = "Glorified pitchfork... of destuction!";
		} /*,
		'launcher':function(){//tendril frame, seven tendril, 2 TR

		}*/
	};

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

	item.addItemIcons = function(array){
		for(let itemName in itemList){
			array.push('icons/' + itemName.camelize());
		}
	};

	item.get = function(type){
		let newItem = new itemList[type]();
		newItem.onHit = itemBehaviors[newItem.behavior];
		newItem.name = type;
		return newItem;
	}
})();