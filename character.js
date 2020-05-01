'use strict';

var velocity = [0,0,0];
var grounded = false;

var touchMove = [0,0,0];

function movement(deltatime) {
    
    var move;
    
    if (isMoving) {
        move = touchMove;
    } else {
        move = new Array(3).fill(0);
        if (keys[87]) {
            //w
            move[2]-=1;
        }
        if (keys[83]) {
            //s
            move[2]+=1;
        }
        if (keys[69]) {
            //d
            move[1]+=1;
        }
        if (keys[81]) {
            //a
            move[1]-=1;
        }
        if (keys[68]) {
            //d
            move[0]+=1;
        }
        if (keys[65]) {
            //a
            move[0]-=1;
        }
    }
    
    if (!freelook) {
        move[1] = 0;
        if ((move[0]!=0 || move[1]!=0 || move[2]!=0)) {
            
            var trans = m3.scaling([movespeed,movespeed,movespeed]);
            
            trans = m3.yRotate(trans,rot[0]);
            
            move = m3.transformVector(trans,move);
            
            velocity[0] = move[0];
            velocity[2] = move[2];
        } else {
            velocity[0] = 0;
            velocity[2] = 0;
        }
        
        velocity[1] -= deltatime*14;
        
        if (keys[32] && grounded) {
            velocity[1] = 6;
        }
        
        if (keys[69]) {
            velocity[1] += deltatime*20;
        }
        
        var feet = [pos[0],pos[1]-1.4,pos[2]];
        
        var footBlock = feet.map(x => Math.floor(x));

        if (velocity[0] != 0) {

            feet[0] = feet[0]+velocity[0]*deltatime;
            
            var sideBlock = feet.slice();
            sideBlock[0] += 0.5*Math.sign(velocity[0]);
            sideBlock = sideBlock.map(x => Math.floor(x));
            if (sideBlock[0] != footBlock[0]) {
                var collision = false;
                for (var y = 0; y <= 3; y++) {
                    for (var z = -1; z <= 1; z++) {
                        var block = sideBlock.slice();
                        block[1] += y;
                        block[2] += z;
                        var posOnBlock = feet.slice();
                        posOnBlock[1] -= block[1];
                        posOnBlock[2] -= block[2];

                        if (posOnBlock[1] > -1.5 && posOnBlock[2] > -0.1 &&
                            posOnBlock[1] <  0.9 && posOnBlock[2] <  1.1) {
                            
                            if (getVoxel(block)) {
                                collision = true;
                                break;
                            }
                        }
                    }
                }

                if (collision) {
                    if (velocity[0] < 0) {
                        var border = sideBlock[0]+1+0.11;
                        
                        if (feet[0] < border) {
                            feet[0] = border;
                            velocity[0] = 0;
                        }
                    }
                    
                    if (velocity[0] > 0) {
                        var border = sideBlock[0]-0.11;
                        
                        if (feet[0] > border) {
                            feet[0] = border;
                            velocity[0] = 0;
                        }
                    }
                }
            }
        }
        
        if (velocity[2] != 0) {
            
            feet[2] = feet[2]+velocity[2]*deltatime;
        
            var sideBlock = feet.slice();
            sideBlock[2] += 0.5*Math.sign(velocity[2]);
            sideBlock = sideBlock.map(x => Math.floor(x));
            if (sideBlock[2] != footBlock[2]) {
                var collision = false;
                for (var y = -1; y <= 3; y++) {
                    for (var x = -1; x <= 1; x++) {
                        var block = sideBlock.slice();
                        block[1] += y;
                        block[0] += x;
                        var feetOnBlock = feet.slice();
                        feetOnBlock[1] -= block[1];
                        feetOnBlock[0] -= block[0];

                        if (feetOnBlock[1] > -1.5 && feetOnBlock[0] > -0.1 &&
                            feetOnBlock[1] <  0.9 && feetOnBlock[0] <  1.1) {
                            
                            if (getVoxel(block)) {
                                collision = true;
                                break;
                            }
                        }
                    }
                }

                if (collision) {
                    if (velocity[2] < 0) {
                        var border = sideBlock[2]+1+0.11;
                        
                        if (feet[2] < border) {
                            feet[2] = border;
                            velocity[2] = 0;
                        }
                    }
                    
                    if (velocity[2] > 0) {
                        var border = sideBlock[2]-0.11;
                        
                        if (feet[2] > border) {
                            feet[2] = border;
                            velocity[2] = 0;
                        }
                    }
                }
            }
        }

        grounded = false;
        feet[1] = feet[1]+velocity[1]*deltatime;

        var groundBlock = feet.slice();
        groundBlock[1] -= 0.1;
        groundBlock = groundBlock.map(x => Math.floor(x));

        if (feet[1] < groundBlock[1]+1 && velocity[1] < 0) {
            var blockBelow = false;
            for (var x = -1; x <= 1; x++) {
                for (var z = -1; z <= 1; z++) {
                    var block = groundBlock.slice();
                    block[0] += x;
                    block[2] += z;
                    var posOnBlock = pos.slice();
                    posOnBlock[0] -= block[0];
                    posOnBlock[2] -= block[2];

                    if (posOnBlock[0] > -0.1 && posOnBlock[2] > -0.1 &&
                        posOnBlock[0] <  1.1 && posOnBlock[2] <  1.1) {
                        
                        if (getVoxel(block)) {
                            blockBelow = true;
                            break;
                        }
                    }
                }
            }

            if (blockBelow) {
                grounded = true;
                feet[1] = groundBlock[1]+1;
                velocity[1] = 0;
            }
        }

        
        var headBlock = pos.slice();
        headBlock[1] += 0.1;
        headBlock = headBlock.map(x => Math.floor(x));
        
        if (feet[1]+1.5 > headBlock[1] && velocity[1] > 0) {
            var blockAbove = false;
            for (var x = -1; x <= 1; x++) {
                for (var z = -1; z <= 1; z++) {
                    var block = headBlock.slice();
                    block[0] += x;
                    block[2] += z;
                    var posOnBlock = pos.slice();
                    posOnBlock[0] -= block[0];
                    posOnBlock[2] -= block[2];

                    if (posOnBlock[0] > -0.1 && posOnBlock[2] > -0.1 &&
                        posOnBlock[0] <  1.1 && posOnBlock[2] <  1.1) {
                        
                        if (getVoxel(block)) {
                            blockAbove = true;
                            break;
                        }
                    }
                }
            }

            if (blockAbove) {
                feet[1] = headBlock[1]-1.5;
                
                if (velocity[1] > 0) velocity[1] = 0;
            }
        }

        pos = [feet[0],feet[1]+1.4,feet[2]];
    } else {
        if ((move[0]!=0 || move[1]!=0 || move[2]!=0)) {
            
            var trans = m3.scaling([fmovespeed,fmovespeed,fmovespeed]);
            
            trans = m3.yRotate(trans,frot[0]);
            trans = m3.xRotate(trans,frot[1]);
            
            move = m3.transformVector(trans,move);
            
            fpos = map2([move,fpos], (a,b) => (a*deltatime*4.0+b));
        }
    }
}