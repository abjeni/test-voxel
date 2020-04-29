

canvas.addEventListener("mousedown", function(e) {
    mouseclick = [e.clientX,e.clientY];
});

canvas.addEventListener("mouseup", function(e) {
    var m = [e.clientX,e.clientY];
    
    var dm = new Array(2);
    dm[0] = mouseclick[0]-m[0];
    dm[1] = mouseclick[1]-m[1];
    
    if (Math.abs(dm[0])+Math.abs(dm[1]) < 5.0) {
        
        var trans = m3.identity();
        trans = m3.yRotate(trans, rot[0]);
        trans = m3.xRotate(trans, rot[1]);
        
        var uv = [(m[0]*2.0-canvas.width)/canvas.height,-m[1]/canvas.height*2.0+1.0];

        var rd = [uv[0],uv[1],-1];
        var len = 1.0/Math.sqrt(dot2(rd));
        rd = rd.map(x => x*len);
        rd = m3.transformVector(trans,rd);
        
        var ird = rd.map(x => Math.abs(1.0/x));
        var srd = rd.map(x => Math.sign(x));
        
        var fpos = pos.map(x => Math.floor(x));
        var lpos = map2([pos,fpos], (x,y) => x-y);
        
        var lens = map2([lpos,ird,srd], function(lpos,ird,srd) {
            if (srd == 1) lpos = 1-lpos;
            return lpos*ird;
        });

        var d = 0;
        
        
        var closest;
        for (var i = 0; i < 20; i++) {
            
            if (lens[0] < lens[1] && lens[0] < lens[2])
                closest = 0;
            else if (lens[1] < lens[2])
                closest = 1;
            else
                closest = 2;

            var len = lens[closest];
            lens[closest] += ird[closest];
            fpos[closest] += srd[closest];
            if (getvoxel(fpos)) {
                break;
            }
        }
        if (getvoxel(fpos)) {
            var normal = new Array(3).fill(0);
            normal[closest] = -srd[closest];
            
            var addBlock;
            if (e.button == 0)
                addBlock = selectedblock;
            else
                addBlock = 0;

            if (addBlock != 0) fpos[closest] -= srd[closest];
            
            var chunkPosition = fpos.map(x => Math.floor(x/chunksize));
            var blockPosition = fpos.map(x => mod(x,chunksize));

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
        //testcubes.push(fpos.slice());
        //testcube = map2([rd,pos], (a,b) => a+b);
    }
    
    mouseclick = [-1,-1];
});

document.addEventListener('contextmenu', event => event.preventDefault());

canvas.addEventListener("mousemove", function(e) {
    
    var m = [e.clientX,e.clientY];
    
    if (mouseclick[0] != -1) {
        var a;
        if (freelook) {a = frot;}
        else {a = rot;}
        a[0] -= (m[0]-lm[0])*0.01;
        a[1] = Math.min(Math.max(
		         a[1]-(m[1]-lm[1])*0.01,
				 -Math.PI*0.5),Math.PI*0.5);
    }
    
    lm = m;
    
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