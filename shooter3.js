
// canvas dimensions don't seem to set properly when width and height are defined using css
// it somehow changes the positions of all objects to be relative to the default size (300x150?)
// need to set the width and height in the html
// drawing background with create pattern and with nested loops seems to cause extreme lag

// there is a limit to how many anon functions can be put on the stack over each loop
// when assigning object methods using anonymous functions this can quickly become an issue
	// these functions have been taken out of the object methods
	
// STROKE METHOD KEEPS TRACK OF THE ENTIRE PATH
	// every call to rect, lineto etc adds to the path, you need to explicitly tell it to start over with beginPath
	// in a game loop the stroke method will start to lag as the path becomes longer over each iteration
	// strokerect automatically starts and ends the path.


//(function(){


	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");
	
	var cW = c.width;
	var cH = c.height;
	
	var containerelement = document.getElementById('container');
	var batelement = document.getElementById('bat');
	var pistolelement = document.getElementById('pistol');
	var shotgunelement = document.getElementById('shotgun');
	var assaultelement = document.getElementById('assault');
	var hb = document.getElementById('healthbar');
	var ht = document.getElementById('healthtext');
	
	
	
	var startelement = document.getElementById('startscreen');
	
	startelement.addEventListener('click',function(){
		
		containerelement.removeChild(this);
		playgame();
	});
	
	
	var startdraw = false;
	
	var witchcount = 0;
	// you get one point for killing witch zombies (type 3)
	// updatezombies function handles this.
	// you win the game once you get to 8 points
	
	
	var gameworld = {
	
		x: 0,
		y: 0,
		
		width: 3200,
		height: 2000
	};
	
	var camera = {
	
		x: 0,
		y: 0,
		leftlimit: false,
		rightlimit: false,
		toplimit: false,
		bottomlimit: false,
		width: cW,
		height: cH
	};
	
	
	var bullets = [];
	var zombies = [];
	
	var p1 = Pistol();
	var s1 = Shotgun();
	var a1 = Assault();
	var b1 = Bat();
	
	var gameitems = [p1,s1,a1];
	
	
	var phitbox = {};
	phitbox.x = 0;
	phitbox.y = 0;
	phitbox.h = 0;
	phitbox.w = 0;
	phitbox.on = false;
	phitbox.timer = 0;
	phitbox.struck = false;
	phitbox.timeout = function(){
		if(phitbox.on){
				phitbox.timer += 1;
				if(phitbox.timer >= 10){
					phitbox.on = false;
					phitbox.struck = false;
					phitbox.timer = 0;
				}
			}
	};
	
	imageTotal = 8;
	imageLoader = 0;
	
	var backImg = new Image();
	backImg.src = 'images/background11PNG.png';
	
	var backH;
	var backW;
	
	backImg.onload = function(){
		backH = this.width;
		backW = this.height;
		imageLoader += 1;
	};
	
	var zombie1 = new Image();
	zombie1.src = 'images/zombie1.png';
	zombie1.onload = function(){
		imageLoader += 1;
	};
	
	var zombie2 = new Image();
	zombie2.src = 'images/zombie2.png';
	zombie2.onload = function(){
		imageLoader += 1;
	};
	
	var zombie3 = new Image();
	zombie3.src = 'images/zombie3.png';
	zombie3.onload = function(){
		imageLoader += 1;
	};
	
	var pimage = new Image();
	pimage.src = 'images/player.png';
	pimage.onload = function(){
		imageLoader += 1;
	};
	
	var pistolimage = new Image();
	pistolimage.src = 'images/Pistol.png';
	pistolimage.onload = function(){
		imageLoader += 1;
	};
	
	var shotgunimage = new Image();
	shotgunimage.src = 'images/Shotgun.png';
	shotgunimage.onload = function(){
		imageLoader += 1;
	};
	
	var assaultimage = new Image();
	assaultimage.src = 'images/Assault.png';
	assaultimage.onload = function(){
		imageLoader += 1;
	};
	
	var player = {};
	player.x = 0;
	player.y = 0;
	player.w = 50;
	player.h = 50;
	
	player.v = 2;
	player.vx = 0;
	player.vy = 0;
	
	player.aggro = false;
	player.aggroclock = 0;
	
	
	player.facedirection = 0;
	// down:0, left:1, up:2, right:3
	player.movementclock = 0;
	
	player.image = pimage;
	
	player.hp = 100;
	
	player.selected = 'bat';
	player.inventory = {
		bat:0,
		pistol:0,
		shotgun:0,
		assault:0
	};
	player.equipped = {};
	
	player.attack = function(){
	
		if(player.equipped.type == 'gun'){
			if(spaceDown){
				player.equipped.shoot();
				player.aggro = true;
				
			}
		}
		else if(player.equipped.type == 'melee'){
		
			if(spaceDown){
				player.equipped.swing();
			}
		}
		else{}
	
	};
	
	player.cooldown = function(){
	
		if(player.aggro){
			player.aggroclock += 1;
			
			if(player.aggroclock >= 1000){
				player.aggro = false;
				player.aggroclock = 0;
			}
		
		}
	
	};
	
	
	function Zombie(type, x, y){
	
		var zombie = {};
		zombie.type = type;
		//type 1,2 normals 1 and 2
		// type 3 fast zombie (stronger attacks, faster, smaller search radius)
		zombie.x = x;
		zombie.y = y;
		zombie.w = 40;
		zombie.h = 40;
		zombie.v = 0;
		zombie.vx = 0;
		zombie.vy = 0;
		zombie.hp = 0;
		zombie.damage = 0;
		
		zombie.hitbox = {};
		zombie.hitbox.x = 0;
		zombie.hitbox.y = 0;
		zombie.hitbox.w = 0;
		zombie.hitbox.h = 0;
		zombie.hitbox.timer = 0;
		zombie.hitbox.on = false;
		zombie.hitbox.struck = false;
		
		zombie.attacking = false;
		zombie.attackclock = 0;
		
		zombie.searchradius = 0;
		zombie.targetlvl = 0;
		
		zombie.direction = 'none';
		// defines movement
		zombie.facedirection = 0;
		// defines the image
		//left: 3, up: 2, right: 1, down: 0
		
		zombie.moveclock = 0;
		
		zombie.animateclock = 0;
		
		zombie.image;
		
		return zombie;
	
	}
	
	function Bullet(){
	
		var bullet = {};
		bullet.type = 'gun';
		bullet.startx = 0;
		bullet.starty = 0;
		bullet.x = 0;
		bullet.y = 0;
		bullet.distance = 0;
		bullet.v = 0;
		bullet.vx = 0;
		bullet.vy = 0;
		bullet.length = 0;
		bullet.width = 0;
		bullet.damage = 0;
		bullet.range = 0;
		
		
		bullet.move = function(){
			bullet.x += bullet.vx;
			bullet.y += bullet.vy;
			bullet.distance = Math.sqrt((bullet.x-bullet.startx)*(bullet.x-bullet.startx)+(bullet.y-bullet.starty)*(bullet.y-bullet.starty))
		};
		
		bullet.draw = function(){
		
			ctx.fillRect(bullet.x,bullet.y,bullet.length,bullet.width);
		
		};
		
		return bullet;
	}
	
	function Pistol(){
	
		var pistol = {};
		pistol.x = 200;
		pistol.y = 800;
		pistol.w = 30;
		pistol.h = 20;
		pistol.equipped = false;
		pistol.type = 'gun';
		pistol.name = 'pistol';
		pistol.firerate = 50;
		pistol.oldtime = 0;
		pistol.newtime = 0;
		pistol.ready = true;
		pistol.reloadclock = 0;
		
		pistol.image = pistolimage;
		
		pistol.shoot = function(){
		
			if(pistol.ready){
				var bullet = Bullet();
				
				bullet.damage = 10;
				bullet.range = 200;
				bullet.v = 8;
				
				if(player.facedirection == 0){
					bullet.length = 2;
					bullet.width = 4;
					bullet.startx = player.x + player.w/2;
					bullet.x = player.x + player.w/2;
					bullet.starty = player.y + player.h;
					bullet.y = player.y + player.h;
					bullet.vx = 0;
					bullet.vy = bullet.v;
					
				}
				else if(player.facedirection == 1){
					bullet.length = 4;
					bullet.width = 2;
					bullet.startx = player.x-4;
					bullet.x = player.x-4;
					bullet.starty = player.y + player.h/2;
					bullet.y = player.y + player.h/2;
					bullet.vx = -bullet.v;
					bullet.vy = 0;
				}
				else if(player.facedirection == 2){
					bullet.length = 2;
					bullet.width = 4;
					bullet.startx = player.x;
					bullet.x = player.x+player.w/2;
					bullet.starty = player.y;
					bullet.y = player.y;
					bullet.vx = 0;
					bullet.vy = -bullet.v;
				
				}
				else if(player.facedirection == 3){
					bullet.length = 4;
					bullet.width = 2;
					bullet.startx = player.x + player.w;
					bullet.x = player.x+player.w;
					bullet.starty = player.y + player.h/2;
					bullet.y = player.y+player.h/2;
					bullet.vx = bullet.v;
					bullet.vy = 0;
				}
				
				pistol.ready = false;
				pistol.oldtime = pistol.reloadclock;
				bullets.push(bullet);
			}
		
		};
		pistol.reload = function(){
		
			
			pistol.reloadclock += 1;
			pistol.newtime = pistol.reloadclock;
			
			if(pistol.newtime - pistol.oldtime > pistol.firerate){
				pistol.ready = true;
			}
			
			if(pistol.reloadclock > 99999){
				pistol.reloadclock = 0;
			}
		
		};
		
		
		return pistol;
	
	}
	function Shotgun(){
		var shotgun = {};
		shotgun.x = 1300;
		shotgun.y = 400;
		shotgun.w = 50;
		shotgun.h = 30;
		shotgun.equipped = false;
		shotgun.type = 'gun';
		shotgun.name = 'shotgun';
		shotgun.firerate = 75;
		shotgun.oldtime = 0;
		shotgun.newtime = 0;
		shotgun.ready = true;
		shotgun.reloadclock = 0;
		
		shotgun.image = shotgunimage;
		
		shotgun.shoot = function(){
		
			if(shotgun.ready){
			
				var i = 0;
				while(i < 5){
					var bullet = Bullet();
					bullet.damage = 25;
					bullet.range = 150;
					bullet.v = 8;
					bullet.length = 5;
					bullet.width = 5;
					
					if(player.facedirection == 0){
						
						bullet.startx = player.x + player.w/2 - 10 + i*5;
						bullet.x = player.x + player.w/2 - 10 + i*5;
						bullet.starty = player.y + player.h;
						bullet.y = player.y + player.h;
						bullet.vx = -4 + 2*i;
						bullet.vy = bullet.v;
						
					}
					else if(player.facedirection == 1){
						
						bullet.startx = player.x-5;
						bullet.x = player.x-5;
						bullet.starty = player.y + player.h/2 - 10 + i*5;
						bullet.y = player.y + player.h/2 - 10 + i*5;
						bullet.vx = -bullet.v;
						bullet.vy = -4 + 2*i;
					}
					else if(player.facedirection == 2){
						
						bullet.startx = player.x + player.w/2 - 10 + i*5;
						bullet.x = player.x + player.w/2 - 10 + i*5;
						bullet.starty = player.y;
						bullet.y = player.y;
						bullet.vx = -4 + 2*i;
						bullet.vy = -bullet.v;
					
					}
					else if(player.facedirection == 3){
						
						bullet.startx = player.x+player.w;
						bullet.x = player.x+player.w;
						bullet.starty = player.y + player.h/2 - 10 + i*5;
						bullet.y = player.y + player.h/2 - 10 + i*5;
						bullet.vx = bullet.v;
						bullet.vy = -4 + 2*i;
					}
					
					i++;
					bullets.push(bullet);
				}
				
				shotgun.ready = false;
				shotgun.oldtime = shotgun.reloadclock;
				
			}
		
		};
		shotgun.reload = function(){
		
			
			shotgun.reloadclock += 1;
			shotgun.newtime = shotgun.reloadclock;
			
			if(shotgun.newtime - shotgun.oldtime > shotgun.firerate){
				shotgun.ready = true;
			}
			
			if(shotgun.reloadclock > 99999){
				shotgun.reloadclock = 0;
			}
		
		};
		
		return shotgun;
	
	};
	
	function Assault(){
	
		var assault = {};
		assault.x = 2200;
		assault.y = 1200;
		assault.w = 50;
		assault.h = 30;
		assault.equipped = false;
		assault.type = 'gun';
		assault.name = 'assault';
		assault.firerate = 10;
		assault.oldtime = 0;
		assault.newtime = 0;
		assault.ready = true;
		assault.reloadclock = 0;
		
		assault.image = assaultimage;
		
		assault.shoot = function(){
		
			if(assault.ready){
			
				var bullet = Bullet();
				
				bullet.damage = 15;
				bullet.range = 400;
				bullet.v = 8;
				
				if(player.facedirection == 0){
					bullet.length = 2;
					bullet.width = 4;
					bullet.startx = player.x + player.w/2;
					bullet.x = player.x + player.w/2;
					bullet.starty = player.y + player.h;
					bullet.y = player.y + player.h;
					bullet.vx = 0;
					bullet.vy = bullet.v;
					
				}
				else if(player.facedirection == 1){
					bullet.length = 4;
					bullet.width = 2;
					bullet.startx = player.x-4;
					bullet.x = player.x-4;
					bullet.starty = player.y + player.h/2;
					bullet.y = player.y + player.h/2;
					bullet.vx = -bullet.v;
					bullet.vy = 0;
				}
				else if(player.facedirection == 2){
					bullet.length = 2;
					bullet.width = 4;
					bullet.startx = player.x;
					bullet.x = player.x+player.w/2;
					bullet.starty = player.y;
					bullet.y = player.y;
					bullet.vx = 0;
					bullet.vy = -bullet.v;
				
				}
				else if(player.facedirection == 3){
					bullet.length = 4;
					bullet.width = 2;
					bullet.startx = player.x + player.w;
					bullet.x = player.x+player.w;
					bullet.starty = player.y + player.h/2;
					bullet.y = player.y+player.h/2;
					bullet.vx = bullet.v;
					bullet.vy = 0;
				}
				
				assault.ready = false;
				assault.oldtime = assault.reloadclock;
				bullets.push(bullet);
			}
		
		};
		assault.reload = function(){
		
			
			assault.reloadclock += 1;
			assault.newtime = assault.reloadclock;
			
			if(assault.newtime - assault.oldtime > assault.firerate){
				assault.ready = true;
			}
			
			if(assault.reloadclock > 99999){
				assault.reloadclock = 0;
			}
		
		};
		
		return assault;
	
	};
	
	
	function Bat(){
	
		var bat = {};
		
		bat.type = 'melee';
		bat.rof = 50;
		bat.timer = 0;
		bat.ready = true;
		bat.damage = 20;
		
		bat.swing = function(){
			if(bat.ready && !phitbox.on){
				phitbox.on = true;
				bat.ready = false;
				
				if(player.facedirection == 0){
				
					phitbox.x = player.x;
					phitbox.y = player.y + player.h;
					phitbox.w = player.w;
					phitbox.h = 35;	
				}
				else if(player.facedirection == 1){
					phitbox.x = player.x - 35;
					phitbox.y = player.y;
					phitbox.w = 35;
					phitbox.h = player.h;
				}
				else if(player.facedirection == 2){
					phitbox.x = player.x;
					phitbox.y = player.y - 35;
					phitbox.w = player.w;
					phitbox.h = 35;
				}
				else if(player.facedirection == 3){
					phitbox.x = player.x + player.w;
					phitbox.y = player.y;
					phitbox.w = 35;
					phitbox.h = player.h;
				}
				else{}
			}
		
		};
		
		bat.reload = function(){
		
			if(bat.ready == false){
				bat.timer += 1;
				if(bat.timer > bat.rof){
					bat.ready = true;
					bat.timer = 0;
				}
			}
			
		};
		
		bat.draw = function(){};
		return bat;
	
	}
	function zombiespawns(){
	
		var t1 = 200;
		var t2 = 60;
		var t3 = 20;
		
		while(t1 > 0){
			var z = Zombie(1,(Math.random()*gameworld.width),(Math.random()*gameworld.height));
			if(z.x <= camera.width && z.y <= camera.height){
			}
			else{
				setzombie(z);
				zombies.push(z);
				t1 -= 1;
			}
		}
		while(t2 > 0){
			var z = Zombie(2,(Math.random()*gameworld.width),(Math.random()*gameworld.height));
			if(z.x <= camera.width && z.y <= camera.height){
			}
			else{
				setzombie(z);
				zombies.push(z);
				t2 -= 1;
			}
		}
		while(t3 > 0){
			var z = Zombie(3,(Math.random()*gameworld.width),(Math.random()*gameworld.height));
			if(z.x <= camera.width && z.y <= camera.height){
			}
			else{
				setzombie(z);
				zombies.push(z);
				t3 -= 1;
			}
		}
	
	}
	
	function initialize(){
	
		player.x = camera.width/2 - player.w/2;
		player.y = camera.height/2 - player.h/2;
		camera.x = 0;
		camera.y = 0;
		
		zombiespawns();
		
		player.inventory.bat = b1;
		
		
		player.equipped = b1;
		
		batelement.style.backgroundColor = 'yellow';
		pistolelement.style.backgroundColor = 'gray';
		shotgunelement.style.backgroundColor = 'gray';
		assaultelement.style.backgroundColor = 'gray';
	
	}
	
	batelement.addEventListener('click', function(){
		player.equipped = b1;
		batelement.style.backgroundColor = 'yellow';
		if(player.inventory.pistol){
			pistolelement.style.backgroundColor = 'white';
		}
		else{
			pistolelement.style.backgroundColor = 'gray';
		}
		if(player.inventory.shotgun){
			shotgunelement.style.backgroundColor = 'white';
		}
		else{
			shotgunelement.style.backgroundColor = 'gray';
		}
		if(player.inventory.assault){
			assaultelement.style.backgroundColor = 'white';
		}
		else{
			assaultelement.style.backgroundColor = 'gray';
		}
		
	
	});
	pistolelement.addEventListener('click', function(){
		if(player.inventory.pistol){
			player.equipped = p1;
			pistolelement.style.backgroundColor = 'yellow';
			
			batelement.style.backgroundColor = 'white';
		
			if(player.inventory.shotgun){
				shotgunelement.style.backgroundColor = 'white';
			}
			else{
				shotgunelement.style.backgroundColor = 'gray';
			}
			if(player.inventory.assault){
				assaultelement.style.backgroundColor = 'white';
			}
			else{
				assaultelement.style.backgroundColor = 'gray';
			}
		}
		
		
	
	});
	shotgunelement.addEventListener('click', function(){
		if(player.inventory.shotgun){
			player.equipped = s1;
			shotgunelement.style.backgroundColor = 'yellow';
			
			batelement.style.backgroundColor = 'white';
		
			if(player.inventory.pistol){
				pistolelement.style.backgroundColor = 'white';
			}
			else{
				pistolelement.style.backgroundColor = 'gray';
			}
			if(player.inventory.assault){
				assaultelement.style.backgroundColor = 'white';
			}
			else{
				assaultelement.style.backgroundColor = 'gray';
			}
		}
	
	});
	assaultelement.addEventListener('click', function(){
		if(player.inventory.assault){
			player.equipped = a1;
			assaultelement.style.backgroundColor = 'yellow';
			
			batelement.style.backgroundColor = 'white';
		
			if(player.inventory.shotgun){
				shotgunelement.style.backgroundColor = 'white';
			}
			else{
				shotgunelement.style.backgroundColor = 'gray';
			}
			if(player.inventory.pistol){
				pistolelement.style.backgroundColor = 'white';
			}
			else{
				pistolelement.style.backgroundColor = 'gray';
			}
		}
		
	});
	
	
	// movement handlers
	var moveUp = false;
	var moveDown = false;
	var moveLeft = false;
	var moveRight = false;
	var spaceDown = false;
	
	var LEFT = 37;
	var UP = 38;
	var RIGHT = 39;
	var DOWN = 40;
	var SPACE = 32;
	
	window.addEventListener('keydown', keydownhandle);
	window.addEventListener('keyup', keyuphandle);
	
	function keydownhandle(e){
		
		switch (e.keyCode){
		
			case LEFT:
				moveLeft = true;
				player.facedirection = 1;
				break;
			case UP:
				moveUp = true;
				player.facedirection = 2;
				break;
			case RIGHT:
				moveRight = true;
				player.facedirection = 3;
				break;
			case DOWN:
				moveDown = true;
				player.facedirection = 0;
				break;
			case SPACE:
				spaceDown = true;
				break;
			default:
		}
	}
	
	function keyuphandle(e){
		
		switch (e.keyCode){
		
			case LEFT:
				moveLeft = false;
				
				player.movementclock = 0;
				break;
			case UP:
				moveUp = false;
				
				player.movementclock = 0;
				break;
			case RIGHT:
				moveRight = false;
				
				player.movementclock = 0;
				break;
			case DOWN:
				moveDown = false;
				
				player.movementclock = 0;
				break;
			case SPACE:
				spaceDown = false;
				break;
			default:
		}		
	}
	
	
	
	function playgame(){
		
		if (player.hp > 0 && witchcount < 8){
			update();
			draw();
			requestAnimationFrame(playgame);
		}
		if(player.hp == 0){
			alert('You were eaten by zombies. Reload to try again.');
		}
		if(player.hp > 0 && witchcount >= 8){
			alert('Congratulations you beat the zombie horde! Reload to play again');
		}
	}
	
	// utility functions //
	
	function bulletcollision(b, z){
	
		var xdist = (b.x + b.length/2) - (z.x + z.w/2);
		var ydist = (b.y + b.width/2) - (z.y + z.h/2);
		
		var wid = b.length/2 + z.w/2;
		var hei = b.width/2 + z.h/2;
		
		if(Math.abs(xdist)<wid && Math.abs(ydist)<hei){
			return true
		}
		else{
			return false
		}
	}
	function meleehit(b, z){
		// b can be phitbox or zombie hitbox
		// z can be zombie or player
		if(b.on){
			var xdist = (b.x + b.w/2) - (z.x + z.w/2);
			var ydist = (b.y + b.h/2) - (z.y + z.h/2);
			
			var wid = b.w/2 + z.w/2;
			var hei = b.h/2 + z.h/2;
			
			if(Math.abs(xdist)<wid && Math.abs(ydist)<hei){
				return true
			}
			else{
				return false
			}
		}
	}
	function zombiecollision(p, r){
	
		var xdist = ((p.x+p.w/2)-(r.x+r.w/2));
		var ydist = ((p.y+p.h/2)-(r.y+r.h/2));
		
		var wid = ((p.w/2)+(r.w/2));
		var hei = ((p.h/2)+(r.h/2));
		
		var xoverlap = wid - Math.abs(xdist);
		var yoverlap = hei - Math.abs(ydist);
		
		if(Math.abs(xdist)<wid && Math.abs(ydist)<hei){
		
			if(xoverlap > yoverlap){
				// either the top or bottom was hit
				if(ydist < 0){
					//bottom of p was hit, top of r was hit
					p.y -= yoverlap;
				}
				else if(ydist > 0){
					// top of p was hit, bottom of r was hit
					p.y += yoverlap;
				}
			}
			else if(xoverlap < yoverlap){
				// either the left or right was hit
				if(xdist > 0){
					// left of p was hit, right of r was hit
					p.x += xoverlap;
				}
				else if(xdist < 0){
					// right of p was hit, left of r was hit
					p.x -= xoverlap;
				}
			}
			
			
		}
	
	}
	
	function moveplayer(){
	
		player.vx = 0;
		player.vy = 0;
		
		if(moveLeft && !moveRight){
			player.vx = -player.v;
			player.movementclock += 0.2;
		}
		if(moveRight && !moveLeft){
			player.vx = player.v;
			player.movementclock += 0.2;
		}
		if(moveUp && !moveDown){
			player.vy = -player.v;
			player.movementclock += 0.2;
		}
		if(moveDown && !moveUp){
			player.vy = player.v;
			player.movementclock += 0.2;
		}
		
		
		player.x += player.vx;
		player.y += player.vy;
		
		// gameworld boundaries
		if(player.x <= 0){
			player.x = 0;
		}
		if(player.x+player.w >= gameworld.width){
			player.x = gameworld.width-player.w;
		}
		if(player.y <= 0){
			player.y = 0;
		}
		if(player.y+player.h >= gameworld.height){
			player.y = gameworld.height-player.h;
		}
		
	}
	
	function movecamera(){
	
		// Player can move within camera box defined by half of camera width and height
		
		// Camera cannot move at the edges. The camera blocking edge variables are turned on.
		
		// The camera blocking edge variables are turned off when player gets half
		// a camera width or height from the edge. Camera can then move again.
		
		
		if(!camera.leftlimit && !camera.rightlimit){
			
			// camera left and right box
			if((player.x+player.w/2 <= camera.x + camera.width/3) || (player.x+player.w/2 >= camera.x + 2*camera.width/3)){
				camera.x += player.vx;
			}
		}
		if(!camera.toplimit && !camera.bottomlimit){
			
			// camera top and bottom box
			if((player.y+player.h/2 <= camera.y + camera.height/3) || (player.y+player.h/2 >= camera.y + 2*camera.height/3)){
				camera.y += player.vy;
			}
		}
		
		
		// turns edge variables off once player is away from edge
		if(camera.leftlimit){
			if(player.x+player.w/2 >= camera.width/2){
				camera.leftlimit = false;
			}
		}
		if(camera.rightlimit){
			if(player.x+player.w/2 <= gameworld.width - camera.width/2){
				camera.rightlimit = false;
			}
		}
		if(camera.toplimit){
			if(player.y+player.h/2 >= camera.height/2){
				camera.toplimit = false;
			}
		}
		if(camera.bottomlimit){
			if(player.y+player.h/2 <= gameworld.height - camera.height/2){
				camera.bottomlimit = false;
			}
		}
		
		
		// turns edge variables on when camera is at gameworld boundaries
		if(camera.x < 0){
			camera.leftlimit = true;
			camera.x = 0;
		}
		if(camera.x+camera.width > gameworld.width){
			camera.rightlimit = true;
			camera.x = gameworld.width - camera.width;
		}
		if(camera.y < 0){
			camera.toplimit = true;
			camera.y = 0;
		}
		if(camera.y+camera.height > gameworld.height){
			camera.bottomlimit = true;
			camera.y = gameworld.height - camera.height;
		}
		
		
	}
	
	function setzombie(zombie){
	
		if(zombie.type == 1){
			zombie.v = 0.4;
			zombie.hp = 20;
			zombie.damage = 10;
			zombie.searchradius = 110;
			zombie.image = zombie1;
		}
		else if(zombie.type == 2){
			zombie.v = 0.5;
			zombie.hp = 50;
			zombie.damage = 20;
			zombie.searchradius = 110;
			zombie.image = zombie2;
		}
		else if(zombie.type == 3){
			zombie.v = 0.8;
			zombie.hp = 100;
			zombie.damage = 40;
			zombie.searchradius = 80;
			zombie.image = zombie3;
		}
		else{}
	
	
	}
	
	function randmove(zombie){
	
		if(zombie.direction == 'none'){
				zombie.direction = Math.floor((Math.random()*7));
				zombie.moveclock = Math.floor((Math.random()*50)+50);
			}
			
		else{
			zombie.moveclock -= 1;
			zombie.animateclock += 0.1;
			
			if(zombie.direction == 0){
				zombie.vx = -zombie.v;
				zombie.vy = 0;
				zombie.facedirection = 3;
			}
			else if(zombie.direction == 1){
				zombie.vx = -zombie.v;
				zombie.vy = -zombie.v;
				zombie.facedirection = 2;
			}
			else if(zombie.direction == 2){
				zombie.vx = 0;
				zombie.vy = -zombie.v;
				zombie.facedirection = 2;
			}
			else if(zombie.direction == 3){
				zombie.vx = zombie.v;
				zombie.vy = -zombie.v;
				zombie.facedirection = 2;
			}
			else if(zombie.direction == 4){
				zombie.vx = zombie.v;
				zombie.vy = 0;
				zombie.facedirection = 1;
			}
			else if(zombie.direction == 5){
				zombie.vx = zombie.v;
				zombie.vy = zombie.v;
				zombie.facedirection = 0;
			}
			else if(zombie.direction == 6){
				zombie.vx = 0;
				zombie.vy = zombie.v;
				zombie.facedirection = 0;
			}
			else if(zombie.direction == 7){
				zombie.vx = -zombie.v;
				zombie.vy = zombie.v;
				zombie.facedirection = 0;
			}
			else{}
		}
			

			
		if(zombie.moveclock < 0){
			zombie.direction = 'none';
			zombie.moveclock = 0;
			zombie.animateclock = 0;
		}
		
	}
	
	function zombiesearch(zombie){
	
		// if player is within a certain radius, turns on pursuit behavior
			// sets the velocities and face direction
			// movement actually occurs in move function
		
		var xdistance = (zombie.x+zombie.w/2-(player.x+player.w/2));
		var ydistance = (zombie.y+zombie.h/2-(player.y+player.h/2));
	
		var distance = Math.sqrt((xdistance)*(xdistance)+(ydistance)*(ydistance));
		
		if(distance < zombie.searchradius*2){
			zombie.targetlvl = 1;
			zombie.animateclock += 0.1;
			var v = 0;
			v = zombie.v;
			
			if(player.aggro){
				v = 2*zombie.v;
				zombie.targetlvl = 2;
			}
			
			if(distance < zombie.searchradius){
				if(zombie.targetlvl == 1){
					zombie.targetlvl = 2;
					v = 2*zombie.v;
				}
			}
			
			if(xdistance > 0){
				if(xdistance > 5){
					zombie.facedirection = 3;
				}
				zombie.vx = -v;
			}
			if(xdistance < 0){
				if(xdistance < -5){
					zombie.facedirection = 1;
				}
				zombie.vx = v;
			}
			if(ydistance > 0){
				if(ydistance > 5){
					zombie.facedirection = 2;
				}
				zombie.vy = -v;
			}
			if(ydistance < 0){
				if(ydistance < -5){
					zombie.facedirection = 0;
				}
				zombie.vy = v;
			}
		}
		
		else{
			zombie.targetlvl = 0;
		}
			
	
	}
	
	function zombieattack(zombie){
	
		var xdist = (player.x + player.w/2) - (zombie.x + zombie.w/2);
		var ydist = (player.y + player.h/2) - (zombie.y + zombie.h/2);
		var distance = Math.sqrt((xdist*xdist)+(ydist*ydist));
		
		if(distance < 50){
		if(!zombie.attacking){
			zombie.attacking = true;
			zombie.hitbox.on = true;
			
			if(zombie.facedirection == 0){
				
				zombie.hitbox.x = zombie.x;
				zombie.hitbox.y = zombie.y + zombie.h;
				zombie.hitbox.w = zombie.w;
				zombie.hitbox.h = 20;	
			}
			else if(zombie.facedirection == 3){
				zombie.hitbox.x = zombie.x - 20;
				zombie.hitbox.y = zombie.y;
				zombie.hitbox.w = 20;
				zombie.hitbox.h = zombie.h;
			}
			else if(zombie.facedirection == 2){
				zombie.hitbox.x = zombie.x;
				zombie.hitbox.y = zombie.y - 20;
				zombie.hitbox.w = zombie.w;
				zombie.hitbox.h = 20;
			}
			else if(zombie.facedirection == 1){
				zombie.hitbox.x = zombie.x + zombie.w;
				zombie.hitbox.y = zombie.y;
				zombie.hitbox.w = 20;
				zombie.hitbox.h = zombie.h;
			}
			else{}
		
		}
		}
		else{
			if(zombie.hitbox.on){
				zombie.hitbox.on = false;
			}
			
		}
		
		if(zombie.hitbox.on){
			zombie.hitbox.timer += 1;
			if(zombie.hitbox.timer > 10){
				zombie.hitbox.on = false;
				zombie.hitbox.struck = false;
				zombie.hitbox.timer = 0;
			}
		}
		if(zombie.attacking){
			zombie.attackclock += 1;
			if(zombie.attackclock > 50){
				zombie.attackclock = 0;
				zombie.attacking = false;
			}
		}
		if(zombie.hitbox.on){
			var phit = meleehit(zombie.hitbox,player)
			if(phit){
				if(!zombie.hitbox.struck){
					zombie.hitbox.struck = true;
					player.hp -= zombie.damage;
				}
			}
		}
	
	}
	
	function movezombie(zombie){
		
		if(zombie.targetlvl == 0){
			randmove(zombie);
		}
		else{}
		
		zombie.x += zombie.vx;
		zombie.y += zombie.vy;
		
		// gameworld boundaries
		if(zombie.x <= 0){
			zombie.x = 0;
		}
		if(zombie.x+zombie.w >= gameworld.width){
			zombie.x = gameworld.width-zombie.w;
		}
		if(zombie.y <= 0){
			zombie.y = 0;
		}
		if(zombie.y+zombie.h >= gameworld.height){
			zombie.y = gameworld.height-zombie.h;
		}
	
	}
	
	function itempickup(){
	
		for(var g = 0; g < gameitems.length; g++){
			var xdist = (gameitems[g].x + gameitems[g].w/2) - (player.x + player.w/2);
			var ydist = (gameitems[g].y + gameitems[g].h/2) - (player.y + player.h/2);
			
			var wid = gameitems[g].w/2 + player.w/2;
			var hei = gameitems[g].h/2 + player.h/2;
			
			var name = gameitems[g].name;
			
			if(Math.abs(xdist)<wid && Math.abs(ydist)<hei){
				if(name == 'pistol'){
					player.inventory.pistol = p1;
					pistolelement.style.backgroundColor = 'white';
				}
				else if(name == 'shotgun'){
					player.inventory.shotgun = s1;
					shotgunelement.style.backgroundColor = 'white';
				}
				else if(name == 'assault'){
					player.inventory.assault = a1;
					assaultelement.style.backgroundColor = 'white';
				}
				else{}
				
				gameitems.splice(g,1);
			}
			else{
				
			}
		}
	
	}
	
	function playeractions(){
	
		player.attack();
		
		// turns off aggro from gunfire after certain time
		player.cooldown();
		
		if(player.equipped.type == 'gun'){
			// handles weapon rate of fire, turns weapon on/off after certain amounts of time
			player.equipped.reload();
		}
		if(player.equipped.type == 'melee'){
			phitbox.timeout();
			player.equipped.reload();
			
		}
		
	}
	
	function updatebullets(){
	
		for(var i = 0;i < bullets.length; i++){
			bullets[i].move();
			
			if(bullets[i].distance >= bullets[i].range){
				bullets.splice(i,1);
			}
		}
	
	}
	
	function updatezombies(){
	
		for(var i = 0; i < zombies.length; i++){
		
			zombiesearch(zombies[i]);
			movezombie(zombies[i]);
			zombieattack(zombies[i]);
			
			var mhit = meleehit(phitbox,zombies[i])
			if(mhit){
				if(!phitbox.struck){
					phitbox.struck = true;
					zombies[i].hp -= player.equipped.damage;
				}
					
			}
			
			for(var j = 0;j < bullets.length; j++){
				var hit = bulletcollision(bullets[j],zombies[i]);
				
				
				if(hit){
					zombies[i].hp -= bullets[j].damage;
					bullets.splice(j,1);
				}
				
			}
			
			for(var j = 0; j < zombies.length; j++){
			
				zombiecollision(zombies[i],zombies[j]);
			
			}
			
			zombiecollision(zombies[i],player)
			if(zombies[i].hp <= 0){
				if(zombies[i].type == 3){
					witchcount += 1;
				}
				zombies.splice(i,1)
				
			}
		}
	
	}
	
	function update(){
	
		if(imageLoader == imageTotal && !startdraw){
			initialize();
			startdraw = true;
		}
		moveplayer();
		movecamera();
		playeractions();
		
		updatezombies();
		
		updatebullets();
		
		itempickup();
		
		if(player.hp < 0){
			player.hp = 0;
		}
		var hbw = player.hp * 4;
		var hbwstring = String(hbw) + 'px';
		var htstring = 'Health : ' + String(player.hp);
		hb.style.width = (hbwstring);
		ht.innerHTML = htstring;
	}
	
	function drawbackground(){
	
		ctx.drawImage(
		backImg,
		0,0,1600,1000,
		0,0,gameworld.width,gameworld.height
		);
		
	}
	function drawbullets(){
	
		for(var i = 0;i < bullets.length; i++){
			bullets[i].draw();
		
		}
	
	}
	
	function drawgameitems(){
	
		var iw = 0;
		var ih = 0;
		var img;
		
		for(var g = 0; g < gameitems.length; g++){
		
			if(gameitems[g].name == 'pistol'){
				iw = 64;
				ih = 38;
				img = pistolimage;
			}
			else if(gameitems[g].name == 'shotgun'){
				iw = 96;
				ih = 34;
				img = shotgunimage;
			}
			else if(gameitems[g].name == 'assault'){
				iw = 100;
				ih = 50;
				img = assaultimage;
			}
			else{}
			
			ctx.drawImage(
			img,
			0,0,iw,ih,
			gameitems[g].x,gameitems[g].y,gameitems[g].w,gameitems[g].h
			);
		
		}
		
	}
	
	function drawzombie(zombie){
	
		ctx.drawImage(
			zombie.image,
			(124/3)*(Math.abs((Math.floor(zombie.animateclock%4))-2)),36*zombie.facedirection,124/3,36,
			zombie.x,zombie.y,zombie.w,zombie.h
			);
		
	}
	
	function drawplayer(){
	
		ctx.drawImage(
			player.image,
			48*player.facedirection,48*(Math.floor(player.movementclock%4)),48,48,
			player.x,player.y,player.w,player.h
			);
	
	}
	
	function drawzombies(){
	
		for(var i = 0; i < zombies.length; i++){
		
			drawzombie(zombies[i]);
			
			if(zombies[i].hitbox.on){
				ctx.strokeStyle = 'red';
				ctx.beginPath();
				ctx.moveTo(zombies[i].hitbox.x,zombies[i].hitbox.y)
				ctx.lineTo(zombies[i].hitbox.x + zombies[i].hitbox.w, zombies[i].hitbox.y + zombies[i].hitbox.h);
				ctx.moveTo(zombies[i].hitbox.x + zombies[i].hitbox.w, zombies[i].hitbox.y)
				ctx.lineTo(zombies[i].hitbox.x, zombies[i].hitbox.y + zombies[i].hitbox.h);
				ctx.stroke();
			}
		
		}
		
	}
	function draw(){
	
		if(startdraw){
		
			ctx.clearRect(0,0,cW,cH);
			
			ctx.save();
			// keep canvas centered on the camera
			ctx.translate(-camera.x,-camera.y);
			
			drawbackground();
			drawplayer();	
			drawzombies();
			drawbullets();
			
			drawgameitems();
			
			if(phitbox.on){
				ctx.strokeStyle = 'black';
				ctx.beginPath();
				ctx.moveTo(phitbox.x,phitbox.y)
				ctx.lineTo(phitbox.x + phitbox.w, phitbox.y + phitbox.h);
				ctx.moveTo(phitbox.x + phitbox.w,phitbox.y)
				ctx.lineTo(phitbox.x, phitbox.y + phitbox.h);
				ctx.stroke();
			}
			
			ctx.restore();
			
			
		}
	
	}
	
	
//}())