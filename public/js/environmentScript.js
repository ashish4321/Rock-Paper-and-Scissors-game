var environment = {
    map:[],
    item:function(){

    },
    update:function(){
        environment.map.forEach(function(mapItem){
            mapItem.calculate();
            mapItem.draw();
        })
    }
};

(function(){
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

                    localPlayer.interactables.push(this);

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

            this.onInteract = function(){
                if(this.open)return;
                this.open = true;

                socket.emit('requestInventoryData', environment.map.indexOf(this));//ask for this map item's index

                localPlayer.giveStuff(this.name.capitalize(), this, [], () => {
                    this.open = false;
                });
            };
        }
    };

    environment.item = function(type){
        var mapItem = new mapItems[type]();
        //Here we assign universal default values
        mapItem.x = 0;
        mapItem.y = 0;

        mapItem.mouseCalculate = function(){//this does the math for hovering over things, and tooltips.
            if(!currentMouseEvent || !mapItem.rect)return;//If we don't know anything about the mouse, or where the mouse needs to be, we can't do mouse calculations.

            let x = currentMouseEvent.clientX + ctx.x;//this is a shortcut and small optimization.
            let y = currentMouseEvent.clientY + ctx.y;//this is a shortcut and small optimization.
            let rect = mapItem.rect;//this is just a shortcut

            if((x > rect.x && x < rect.x + rect.width) && (y > rect.y && y < rect.y + rect.height)){//If the mouse is where it needs to be
                let toolTipBox = $('#toolTipBox');//this is a shortcut and an optimization, yet again.

                if(currentMouseEvent.toolTipper !== mapItem && mapItem.toolTipper){//If the mouse has moved, but hasn't left the rect,
                    currentMouseEvent.toolTipper = mapItem;//then claim that mouseEvent

                    toolTipBox.css('left', currentMouseEvent.clientX);//And move the tooltip accordingly.
                    toolTipBox.css('top', currentMouseEvent.clientY);//And move the tooltip accordingly.
                }

                if(currentMouseEvent.toolTipper == mapItem){//If the tooltip's already been initialized,
                    toolTipBox.show();//Make sure some nimwit hasn't hidden it,
                    if(toolTipBox.height() < mapItem.toolTipHeight)toolTipBox.height('+=5');//expand it if neccessary
                    if(toolTipBox.width() < mapItem.toolTipWidth)toolTipBox.width('+=5');//expand it if neccessary
                    else if(toolTipBox.height() >= mapItem.toolTipHeight)toolTipBox.contents().show();//And show the contents if neccessary.
                }

                else {//If the mouse is inside of the rect but the tooltip isn't initialized,
                    //Claim it as so,
                    currentMouseEvent.toolTipper = mapItem;//this guy is for keeping track of if the mouse is inside of the rect.
                    mapItem.toolTipper = true;//And this guy is for keeping track of whether or not it's left the rect
                    
                    toolTipBox.show();//unhide,
                    toolTipBox.empty();//And empty out the remnants of the last tooltip, if any

                    toolTipBox.height('auto');//Let it expand as needed
                    toolTipBox.width('auto');//Let it expand as needed

                    toolTipBox.append('<h3 style = font-size:16px;>' + mapItem.name.capitalize() + '</h3>');//Stick some content in there
                    //toolTipBox.append('<hr>');
                    toolTipBox.append('<p style = font-size:12px;>' + mapItem.toolTip + '</p>');//Stick some content in there

                    toolTipBox.css('left', currentMouseEvent.clientX);//Position it according to the mouse position
                    toolTipBox.css('top', currentMouseEvent.clientY);//Position it according to the mouse position

                    mapItem.toolTipHeight = toolTipBox.height();//Record it's size as a full box
                    mapItem.toolTipWidth = toolTipBox.width();//Record it's size as a full box

                    toolTipBox.height(0);//Make it tiny
                    toolTipBox.width(0);//Make it tiny

                    toolTipBox.contents().hide();//And hide it's innards.
                }
            }
            else {//If the mouse is not where it needs to be,
                if(currentMouseEvent.toolTipper == mapItem){//If we think we're in but we're not,
                    $('#toolTipBox').hide();//Hide it,
                    currentMouseEvent.toolTipper = undefined;//And record that we aren't inside of the rect
                }
                if(mapItem.toolTipper)mapItem.toolTipper = false;//Here too
            }
            

            if(!currentMouseEvent.toolTipper)$('#toolTipBox').hide();//Otherwise, we'll just hide it for good measure.
        }

        //The onSpawn will define local default values, and other stuff that needs to happen upon the instantiation of the object.
        if(mapItem.onSpawn)mapItem.onSpawn();

        return mapItem;
    };
})();

//This returns an object that has been turned into whatever the input object's .type is, with any other attributes inside of the input object assigned to the output object.
function fleshOutMapObject(element){
	var elementCache = element;//We'll need a copy of the original input
	element = new environment.item(element.type);//Because we'll overwrite the original input

	for(let attribute in elementCache){//But then assign any of the attributes of the input object
		element[attribute] = elementCache[attribute];//to the fleshed out object.
	}
	return element;
}