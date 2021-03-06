var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });
var player, arrow, cursors, upButton, downButton, leftButton, rightButton;
var speed = 200;
var myArc, relfectFlag = 0;

//Pad Variables
var padAimX, padAimY, lastpadAimX = 0,
    lastpadAimY = 0,
    pressFlagR1 = 0,
    padFlag = 0;

var alive = true,
    currentLevel = 0,
    deadEnemies = [];
var wonText, levelText;
var fireDelay = 10000,
    bulletSpeed = 400,
    movementSpeed = 7500,
    restDuration = 1500,
    enemiesNum = 2;

var slashFlag = false,
    slashCD = false,
    slashCDColor = "0x00ff00",
    slashGraphChange = 0;
var explosion;
var swordReflect;
var blaster;
var swordSwoosh;
var bgMusic;
var failure;
var enemyHit;
var playLosingAudio = true;
//shake on enemy contact variables
var shakeIntensity = 0.005;
var shakeDuration = 100;
var hitIsPlaying = false;

function preload() {
    game.load.audio('swoosh', 'assets/audio/swoosh.mp3');
    game.load.audio('explosion', 'assets/audio/explosion.mp3');
    game.load.audio('reflect', 'assets/audio/reflect.mp3');
    game.load.audio('blaster', 'assets/audio/blaster.mp3');
    game.load.audio('bgMusic', 'assets/audio/bgMusic.mp3');
    game.load.audio('failure', 'assets/audio/failure.mp3');
    game.load.audio('hit', 'assets/audio/hit.mp3');
    game.load.image('arrow', 'assets/sprites/arrow.png');
    game.load.spritesheet('arena', 'assets/sprites/arena.jpg', 800, 600);
    game.load.spritesheet('enemy', 'assets/sprites/enemy.png', 100, 100);
    game.load.spritesheet('player1', 'assets/sprites/player1.png', 100, 100);
    game.load.spritesheet('player2', 'assets/sprites/player2.png', 100, 100);
    game.load.bitmapFont('desyrel', 'assets/fonts/desyrel.png', 'assets/fonts/desyrel.xml');
    game.load.bitmapFont('stack', 'assets/fonts/shortStack.png', 'assets/fonts/shortStack.xml');
}

function playAudio(sound, v = 1, loop = false, m = false) {
    sound.mute = m;
    sound.volume = v;
    sound.play();
    if (loop)
        sound.loopFull(v);
}

function spriteDirecFromAngle(angle) {
    if (angle >= -22.5 && angle <= 22.5) {
        return "right";
    } else if (angle > -45 - 22.5 && angle < -45 + 22.5) {
        return "top-right";
    } else if (angle >= -90 - 22.5 && angle <= -90 + 22.5) {
        return "top";
    } else if (angle > -135 - 22.5 && angle < -135 + 22.5) {
        return "top-left";
    } else if ((angle <= -180 + 22.5 && angle >= -180) ||
        (angle >= 180 - 22.5 && angle <= 180)) {
        return "left";
    } else if (angle < 135 + 22.5 && angle > 135 - 22.5) {
        return "bot-left";
    } else if (angle <= 90 + 22.5 && angle >= 90 - 22.5) {
        return "bot";
    } else if (angle < 45 + 22.5 && angle > 45 - 22.5) {
        return "bot-right";
    }
}

function generateSprite(sprite, forPlayer = true) {
    var positionArray = [
        "bot", "bot-right", "right", "top-right", "top", "top-left", "left", "bot-left"
    ]
    var i = 0;
    positionArray.forEach(function(position) {
        sprite.animations.add(position, Phaser.ArrayUtils.numberArray(i, i + 3));
        sprite.animations.add(position + '-die', [i + 4]);
        if (forPlayer)
            sprite.animations.add(position + '-slash', [(i + 11) % 48, i + 5, i - 1 > 0 ? i - 1 : 47]);
        else
            sprite.animations.add(position + '-shoot', [i + 5]);
        i += 6;
    });
}

function create() {
    //Set Background and Center Game
    game.add.tileSprite(0, 0, 800, 600, 'arena');
    //game.stage.backgroundColor = '#FFFFFF';
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.refresh();

    //load used audio
    swordSwoosh = game.add.audio('swoosh');
    explosion = game.add.audio('explosion');
    swordReflect = game.add.audio('reflect');
    blaster = game.add.audio('blaster');
    bgMusic = game.add.audio('bgMusic');
    failure = game.add.audio('failure');
    enemyHit = game.add.audio('hit');

    //Create Groups
    bulletsGroup = game.add.group();
    enemiesGroup = game.add.group();

    //Create Player
    player = game.add.sprite(200, 400, 'player1');
    generateSprite(player);
    //player.animations.play('bot', 4, true);
    player.anchor.setTo(0.5, 0.5);
    //player.scale.setTo(0.5, 0.5);
    game.physics.arcade.enable(player);

    player.body.setCircle(25, 25, 7);
    player.body.collideWorldBounds = true;

    //Create Arrow
    arrow = game.add.sprite(200, 400, 'arrow');
    arrow.anchor.setTo(0, 0.5);
    arrow.scale.setTo(0.05, 0.05);
    arrow.alpha = 0.4;
    game.physics.arcade.enable(arrow);

    //Keyboard and Mouse
    //cursors = game.input.keyboard.createCursorKeys();
    game.input.mouse.capture = true;
    upButton = game.input.keyboard.addKey(Phaser.Keyboard.W);
    downButton = game.input.keyboard.addKey(Phaser.Keyboard.S);
    leftButton = game.input.keyboard.addKey(Phaser.Keyboard.A);
    rightButton = game.input.keyboard.addKey(Phaser.Keyboard.D);

    //Gamepad 
    if (padFlag) {
        game.input.gamepad.start();
        pad1 = game.input.gamepad.pad1;
    }

    playAudio(bgMusic, 0.4, true);
}

function endGame() {
    if (!alive) {
        //for (var i = 0; i < myEnemies.length; i++) {
            //myEnemies[i].movement.pause();
        //}
        bgMusic.stop();
        game.add.bitmapText(game.world.centerX / 1.6, game.world.centerY / 1.2, 'stack', 'You Lost!', 60);
        // if (wonText) {
        //     wonText.destroy();
        // }
        if (playLosingAudio) {
            playLosingAudio = false;
            playAudio(failure, 0.4);
        }
    }
    /*else if (myEnemies.length == 0) 
    {
        if (!wonText) 
        {
            movePlayer = function() {};
            slash = function() {};
            player.body.enable = false;
            player.x = game.world.centerX;
            player.y = game.world.centerY * 1.5;
            player.animations.play("bot", 4, true);
            wonText = game.add.bitmapText(game.world.centerX / 3.5, game.world.centerY / 1.2, 'stack', 'You won noob!', 80);
        }
    }*/
}

function levelUpdate() {
    if (myEnemies.length == 0) {
        for (var i = 0; i < myBullets.length; i++) {
            myBullets[i].destroy();
        }
        for (var i = 0; i < safeEnemyBullet.length; i++) {
            safeEnemyBullet[i].destroy();
        }
        myBullets = [];
        if (myArc) {
            myArc.destroy();
            myArc = null;
            relfectFlag = 0;
        }

        currentLevel++;
        clearEnemies();
        generateEnemies();
        if (levelText)
            levelText.destroy();
        levelText = game.add.bitmapText(0, 0, 'desyrel', 'level : ' + currentLevel, 40);
    }
}

function generateEnemies() {
    var ranX, ranY;

    //fireDelay = 10000;
    //bulletSpeed = 1000;
    //movementSpeed = 7500;
    //restDuration = 1500;
    //enemiesNum = 5;
    if (currentLevel % 2 == 0) {
        bulletSpeed += 25;
        movementSpeed -= 50;
    }
    if (currentLevel % 5 == 0) {
        fireDelay -= 50;
        restDuration -= 20;
        enemiesNum++;
    }

    for (let i = 0; i < enemiesNum; i++) {
        ranX = Math.floor((Math.random() * (game.world.width - 100)) + 100);
        ranY = Math.floor((Math.random() * (game.world.height - 100)) + 100);

        enemy = new Enemy(ranX, ranY, fireDelay, bulletSpeed, movementSpeed, restDuration);
        myEnemies.push(enemy);
    }
}

function clearEnemies() {
    for (let i = 0; i < deadEnemies.length; i++) {
        deadEnemies[i].getSprite().destroy();
        deadEnemies.splice(i, 0);
    }
}

function update() {
    game.world.bringToTop(bulletsGroup);
    levelUpdate();
    endGame();
    if (player) {
        //game.debug.body(player);
        game.world.bringToTop(player);
        for (let i = 0; i < myEnemies.length; i++) {
            myEnemies[i].update(player);
            if (myArc && myEnemies[i]) {
                if (checkOverlap(myEnemies[i].getSprite(), myArc)) {
                    //console.log("Enemy Attacked");
                    myEnemies[i].die();
                    deadEnemies.push(myEnemies[i]);
                    myEnemies.splice(i, 1);
                }
            }
        }
        //bullets doesn't affect enemy for 1 second after being released
        for (let i = 0; i < safeEnemyBullet.length; i++) {
            safeEnemyBullet[i].update();
        }
        for (let i = 0; i < myBullets.length; i++) {
            myBullets[i].update();
        }

        //Choose Between Keyboard or Gamepad
        if (padFlag)
            movePlayerPad();
        else
            movePlayer();

        //Control Arrow Movement
        arrow.position.x = player.position.x;
        arrow.position.y = player.position.y;
    }

    //Check Bullet Collison
    for (let i = 0; i < myBullets.length; i++) {
        checkBulletCollison(myBullets[i]);
    }
    if (relfectFlag) {
        myArc.destroy();
        myArc = null;
        relfectFlag = 0;
    }

    game.physics.arcade.collide(player, enemiesGroup, shakeCamera);
}

function shakeCamera(enemySprite, playerSprite) {
    for (var i = 0; i < myEnemies.length; i++) {
        if (myEnemies[i].getSprite() == playerSprite) {
            myEnemies[i].reflect();
        }
    }
    setTimeout(function() {
        hitIsPlaying = false;
    }, 1000);
    if (!hitIsPlaying) {
        playAudio(enemyHit, 0.1);
        hitIsPlaying = true;
    }
    shakeIntensity += 0.001;
    shakeDuration += 10;
    game.camera.shake(shakeIntensity, shakeDuration);
    var shakeInterval = setInterval(function() {
        if (shakeIntensity > 0.05) {
            shakeIntensity -= 0.001;
            shakeDuration -= 10;
        } else {
            clearInterval(shakeInterval);
        }
    }, 100);
}

function checkBulletCollison(myBullet) {
    var bulletSprite = myBullet.getSprite();
    if (bulletSprite) {
        //Check Border and Bullet Collision
        if (bulletSprite.body.blocked.left || bulletSprite.body.blocked.right ||
            bulletSprite.body.blocked.up || bulletSprite.body.blocked.down) {
            myBullet.wallHitCount--;
            if (myBullet.wallHitCount == 0) {
                bulletSearchDestroy(bulletSprite);
            }
        }
        //Check Player and Bullet Collision
        game.physics.arcade.collide(bulletSprite, player, bpCollision);

        //Check Bullet and Bullet Collision
        try {
            game.physics.arcade.collide(bulletSprite, bulletsGroup, bbCollision);
        } catch (err) {
            console.log(err.message);
        }

        //check bullet and enemy collision
        game.physics.arcade.collide(bulletSprite, enemiesGroup, beCollision);

        //Reflection Check without using physics
        if (myArc && bulletSprite) {
            if (checkOverlap(bulletSprite, myArc)) {
                reflect(myBullet);
                relfectFlag = 1;
            } else {
                playAudio(swordSwoosh, 0.1);
            }
        }
    }
}

function checkOverlap(spriteA, spriteB) {
    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();
    return Phaser.Rectangle.intersects(boundsA, boundsB);
}

function reflect(b) {
    if (player) {
        playAudio(swordReflect, 0.1);
        var xdir, ydir, norm;
        if (padFlag) {
            xdir = (padAimX + lastpadAimX) - player.position.x;
            ydir = (padAimY + lastpadAimY) - player.position.y;
        } else {
            xdir = game.input.mousePointer.x - player.position.x;
            ydir = game.input.mousePointer.y - player.position.y;
        }

        norm = Math.sqrt((xdir * xdir) + (ydir * ydir));
        xdir = xdir / norm;
        ydir = ydir / norm;

        b.reflect(xdir, ydir, bulletSpeed * 1.25);
    }

}

function bpCollision(b) {
    player.animations.play(spriteDirecFromAngle(Phaser.Math.radToDeg(arrow.rotation)) + "-die", 1, false);
    player.body.velocity.setTo(0, 0);
    //player.destroy();
    player = null;
    arrow.destroy();
    arrow = null;
    bulletSearchDestroy(b);
    alive = false;
}

function bbCollision(b1, b2) {
    bulletSearchDestroy(b1);
    bulletSearchDestroy(b2);
}

function beCollision(b, e) {
    var bullet;
    for (var i = 0; i < myBullets.length; i++) {
        if (myBullets[i].getSprite() == b) {
            bullet = myBullets[i];
        }
    }
    for (let i = 0; i < myEnemies.length; i++) {
        if (myEnemies[i].getSprite() == e) {
            if (bullet.reflected) {
                myEnemies[i].die();
                deadEnemies.push(myEnemies[i]);
                myEnemies.splice(i, 1);
                bulletSearchDestroy(b);
            } else {
                myEnemies[i].reflect();
            }
        }
    }
}

function bulletSearchDestroy(bullet) {
    for (let i = 0; i < myBullets.length; i++) {
        if (myBullets[i].getSprite() == bullet) {
            myBullets[i].destroy();
            bullet.body.enable = false;
            setTimeout(function() {
                bullet.destroy();
            }, 100);

            myBullets.splice(i, 1);
        }
    }
}

function movePlayer() {
    player.body.velocity.x = 0;
    player.body.velocity.y = 0;
    slowTime();
    if (upButton.isDown) {
        player.body.velocity.y = -speed;
        resetTime();
    } else if (downButton.isDown) {
        player.body.velocity.y = speed;
        resetTime();
    }
    if (leftButton.isDown) {
        player.body.velocity.x = -speed;
        resetTime();
    } else if (rightButton.isDown) {
        player.body.velocity.x = speed;
        resetTime();
    }

    //Control Arrow Direction
    arrow.rotation = game.physics.arcade.angleToPointer(arrow);
    //console.log(spriteDirecFromAngle(Phaser.Math.radToDeg(arrow.rotation)));
    if (!slashFlag) {
        player.animations.play(spriteDirecFromAngle(Phaser.Math.radToDeg(arrow.rotation)), 4, true);
    }

    //game.input.activePointer.leftButton.onDown.add(slash, this);
    if (game.input.activePointer.leftButton.isDown) {
        slash();
    }
    slashCDGraphics(slashGraphChange += 2, slashCDColor);
}

function updateSlashCD() {
    slashCD = false;
    slashCDColor = "0x00ff00";
}

function slashCDGraphics(change, color) {
    var graphics = game.add.graphics(player.position.x, player.position.y);
    graphics.alpha = 1.0;
    graphics.lineStyle(5, color);
    graphics.arc(0, 50, 15, game.math.degToRad(0 + change), game.math.degToRad(135 + change), false);

    graphics.lifespan = 1;

}

function slash() {
    if (!slashCD && player) {
        // CoolDown Stuff
        slashCD = true;
        slashCDColor = "0xff0000";
        var timer = game.time.create(false);
        timer.loop(3000, updateSlashCD, this);
        timer.start();

        slashFlag = true;
        var playerSlash = player.animations.play(spriteDirecFromAngle(Phaser.Math.radToDeg(arrow.rotation)) + "-slash", 10, false);
        playerSlash.onComplete.add(function() {
            slashFlag = false;
        }, this);
        var graphics = game.add.graphics(player.position.x, player.position.y);
        graphics.alpha = 0.0;
        if (padFlag)
            var angle = game.physics.arcade.angleToXY(arrow, padAimX + lastpadAimX, padAimY + lastpadAimY); //Use with Gamepad
        else
            var angle = game.physics.arcade.angleToPointer(arrow); //Use with Keyboard
        graphics.beginFill(0xFF3300);
        graphics.arc(0, 0, 90, angle - game.math.degToRad(45), angle + game.math.degToRad(45), false);
        graphics.endFill();

        var xdir, ydir, norm;

        if (padFlag) {
            xdir = (padAimX + lastpadAimX) - player.position.x;
            ydir = (padAimY + lastpadAimY) - player.position.y;
        } else {
            xdir = game.input.mousePointer.x - player.position.x;
            ydir = game.input.mousePointer.y - player.position.y;
        }

        norm = Math.sqrt((xdir * xdir) + (ydir * ydir));
        xdir = xdir / norm;
        ydir = ydir / norm;

        myArc = game.add.sprite(player.position.x + (40 * xdir), player.position.y + (40 * ydir), graphics.generateTexture());
        myArc.anchor.setTo(0.5, 0.5);
        myArc.alpha = 0.0;
        graphics.lifespan = 2000;

        setTimeout(function() {
            if (myArc) {
                myArc.destroy();
                myArc = null;
            }
        }, 200);
    }
}

function movePlayerPad() {
    slowTime();
    player.body.velocity.x = 0;
    player.body.velocity.y = 0;
    var aimXChange = 0,
        aimYChange = 0;

    padAimX = player.position.x;
    padAimY = player.position.y;

    if (pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_LEFT) || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) < -0.1) {
        player.body.velocity.x = -speed;
        resetTime();
        //arrow.rotation = game.physics.arcade.angleToXY(arrow, padAimX, padAimY);
    } else if (pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_RIGHT) || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) > 0.1) {
        player.body.velocity.x = speed;
        resetTime();
        //arrow.rotation = game.physics.arcade.angleToXY(arrow, padAimX, padAimY);
    }
    if (pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_UP) || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) < -0.1) {
        player.body.velocity.y = -speed;
        resetTime();
        //arrow.rotation = game.physics.arcade.angleToXY(arrow, padAimX, padAimY);
    } else if (pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_DOWN) || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) > 0.1) {
        player.body.velocity.y = speed;
        resetTime();
        //arrow.rotation = game.physics.arcade.angleToXY(arrow, padAimX, padAimY);
    }

    if (pad1.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) < -0.1) {
        padAimX = player.position.x - 100;
        lastpadAimX = -100;
        //arrow.rotation = game.physics.arcade.angleToXY(arrow, padAimX, padAimY);
        aimXChange = 1;
    } else if (pad1.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) > 0.1) {
        padAimX = player.position.x + 100;
        lastpadAimX = 100;
        //arrow.rotation = game.physics.arcade.angleToXY(arrow, padAimX, padAimY);
        aimXChange = 1;
    }
    if (pad1.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) < -0.1) {
        padAimY = player.position.y - 100;
        lastpadAimY = -100;
        //arrow.rotation = game.physics.arcade.angleToXY(arrow, padAimX, padAimY);
        aimYChange = 1;
    } else if (pad1.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) > 0.1) {
        padAimY = player.position.y + 100;
        lastpadAimY = 100;
        //arrow.rotation = game.physics.arcade.angleToXY(arrow, padAimX, padAimY);
        aimYChange = 1;
    }
    if (pad1.justPressed(Phaser.Gamepad.XBOX360_RIGHT_BUMPER)) {
        pressFlagR1 = 1;
    }
    if (pad1.justReleased(Phaser.Gamepad.XBOX360_RIGHT_BUMPER) && pressFlagR1) {
        slash();
        pressFlagR1 = 0;
    }
    if (aimXChange && !aimYChange) {
        lastpadAimY = 0;
    } else if (!aimXChange && aimYChange) {
        lastpadAimX = 0;
    }
    arrow.rotation = game.physics.arcade.angleToXY(arrow, padAimX + lastpadAimX, padAimY + lastpadAimY);
}

function slowTime() {
    for (let i = 0; i < myEnemies.length; i++) {
        myEnemies[i].animSpeed = 10;
    }
    game.time.slowMotion = 6;
    game.time.desiredFps = 360;
}

function resetTime() {
    for (let i = 0; i < myEnemies.length; i++) {
        myEnemies[i].animSpeed = 60;
    }
    game.time.slowMotion = 1;
    game.time.desiredFps = 60;

}