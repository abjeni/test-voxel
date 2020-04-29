'use strict';

var velocity = [0,0,0];
var grounded = false;
function movement(deltatime) {
    
    var move = [0,0,0];
    
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
        
        
        if (velocity[0] != 0) {
            feet[0] = feet[0]+velocity[0]*deltatime;
            var t = [feet[0]+0.1*Math.sign(velocity[0]),feet[1]+0.001,feet[2]]
                    .map(x => Math.floor(x))
            if (getvoxel(t)) {
                feet[0] = t[0]-Math.sign(velocity[0])*(0.5+0.1)+0.5;
                velocity[0] = 0;
            }
        }
        
        if (velocity[2] != 0) {
            feet[2] = feet[2]+velocity[2]*deltatime;

            var t = [feet[0],feet[1]+0.001,feet[2]+0.1*Math.sign(velocity[2])]
                    .map(x => Math.floor(x));
            if (getvoxel(t)) {
                feet[2] = t[2]-Math.sign(velocity[2])*(0.6)+0.5;
                velocity[2] = 0;
            }
        }
        
        grounded = false;
        feet[1] = feet[1]+velocity[1]*deltatime;
        if (getvoxel(feet.map(x => Math.floor(x)))) {
            grounded = true;
            feet[1] = Math.floor(feet[1]+1);
            velocity[1] = 0;
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