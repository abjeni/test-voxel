'use strict';

var mouseLock = false;

function rotatePlayer(dx, dy) {
    var a;
    if (freelook) {a = frot;}
    else {a = rot;}
    a[0] -= dx*0.01;
    a[1] = Math.min(Math.max(
            a[1]-dy*0.01,
            -Math.PI*0.5),Math.PI*0.5);
}

document.addEventListener('pointerlockchange', function(e) {
    mouseLock = document.pointerLockElement === canvas;
}, false);


canvas.addEventListener("mousedown", function(e) {

    mouseclick = [e.clientX,e.clientY];
    canvas.requestPointerLock();
});

canvas.addEventListener("mouseup", function(e) {
    var m = [e.clientX,e.clientY];
    
    var dm = new Array(2);
    dm[0] = mouseclick[0]-m[0];
    dm[1] = mouseclick[1]-m[1];
    
    if (Math.abs(dm[0])+Math.abs(dm[1]) < 5.0) {
    
        var uv = pixelToUv(m);
        var rd = uvToRay(uv);
        var ro = pos;

        var rayCast = castRay(ro,rd, reach);
        //testcube = map2([ro,rd], (ro,rd) => ro+rd*rayCast.d);
        if (rayCast.didHit) {
            
            var addBlock;
            if (e.button == 0)
                addBlock = blocks[blockNumbers[selectedblock]];
            else
                addBlock = blocks.air;

            var block = rayCast.hitBlock.slice();
            if (addBlock.solid) block = rayCast.buildBlock.slice();

            var chunkPosition = block.map(x => Math.floor(x/chunksize));
            var blockPosition = block.map(x => mod(x,chunksize));

            updateChunk(chunkPosition, blockPosition, addBlock);

            for (var i = 0; i < 3; i++) {
                if (blockPosition[i] == 0) {
                    var cp = chunkPosition.slice();
                    cp[i] -= 1;
                    var bp = blockPosition.slice();
                    bp[i] += chunksize;
                    updateChunk(cp, bp, addBlock);
                }
            }
        }
    }
    
    mouseclick = [-1,-1];
});

document.addEventListener('contextmenu', event => event.preventDefault());

canvas.addEventListener("mousemove", function(e) {
    
    if (!mouseLock) {
        var m = [e.clientX,e.clientY];
        
        if (mouseclick[0] != -1) {
            rotatePlayer(m[0]-lm[0],m[1]-lm[1]);
        }
        lm = m;
    } else {
        rotatePlayer(e.movementX,e.movementY);
    }
    
});

canvas.addEventListener("touchmove", function(e) {
    e.preventDefault();
    var m = [e.touches[0].clientX,e.touches[0].clientY];
    
    
    if (mouseclick[0] != -1) {
        if (isMoving) {
            var movement = map2([m,mouseclick], (m,mc) => (m-mc)*0.01);
            movement = movement.map(function(x) {
                if (x > 1) return 1;
                if (x < -1) return -1;
                return x;
            });

            touchMove = [movement[0],0,movement[1]];
        } else {
            rotatePlayer(m[0]-lm[0],m[1]-lm[1]);
        }
    }

    lm = m;
    
});

canvas.addEventListener("touchstart", function(e) {
    e.preventDefault();
    
    var m = [e.touches[0].clientX,e.touches[0].clientY];
    mouseclick = m;

    isMoving = m[0]/gl.canvas.clientWidth < 0.5;

    lm = m;
    
});

var isMoving = false;

canvas.addEventListener("touchend", function(e) {
    e.preventDefault();
    var m = lm;
    
    isMoving = false;

    var dm = new Array(2);
    dm[0] = mouseclick[0]-m[0];
    dm[1] = mouseclick[1]-m[1];
    
    if (Math.abs(dm[0])+Math.abs(dm[1]) < 5.0) {
    
        var uv = pixelToUv(m);
        var rd = uvToRay(uv);
        var ro = pos;

        var rayCast = castRay(ro,rd, reach);
        //testcube = map2([ro,rd], (ro,rd) => ro+rd*rayCast.d);
        if (rayCast.didHit) {
            
            var addBlock;
            if (e.button == 0)
                addBlock = selectedblock;
            else
                addBlock = 0;

            var block = rayCast.hitBlock.slice();
            if (addBlock != 0) block = rayCast.buildBlock.slice();

            var chunkPosition = block.map(x => Math.floor(x/chunksize));
            var blockPosition = block.map(x => mod(x,chunksize));

            updateChunk(chunkPosition, blockPosition, addBlock);

            for (var i = 0; i < 3; i++) {
                if (blockPosition[i] == 0) {
                    var cp = chunkPosition.slice();
                    cp[i] -= 1;
                    var bp = blockPosition.slice();
                    bp[i] += chunksize;
                    updateChunk(cp, bp, addBlock);
                }
            }
        }
    }
    
});

document.addEventListener('keydown', function(e) {
    keys[e.keyCode] = true;

    if (e.keyCode == 82) {
        freelook = !freelook;
        if (freelook) {
            frot = rot.slice();
            fpos = pos.slice();
        }
    }
    var numberKey = e.keyCode-48;
    if (numberKey >= 1 && numberKey <= 9) {
        selectedblock = numberKey;
    }
    //if (e.keyCode == 88) selectedblock = selectedblock+1;
    //if (e.keyCode == 90) selectedblock = selectedblock-1;
}, false);

document.addEventListener('keyup'  , function(e) {keys[e.keyCode] = false;}, false);