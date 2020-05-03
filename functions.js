'use strict';

function makeDataTexture(data, numElements, channels, internalFormat, format) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    var width = numElements;
    var height = 1;
    var pixels = data;
    if (numElements > 4096) {
        width = 4096;
        height = Math.ceil(numElements/4096);

        var newlen = width*height*channels;
        if (data.length != newlen) {
            pixels = new Uint8Array(newlen);
            for (var i = 0; i < data.length; i++) {
                pixels[i] = data[i];
            }
            for (var i = data.length; i < newlen; i++) {
                pixels[i] = 0;
            }
        }
    }

    gl.texImage2D(
        gl.TEXTURE_2D,    // texture type
        0,                // mip level
        internalFormat,       // internal format
        width,            // width
        height,           // height
        0,                // border
        format,  // format
        gl.UNSIGNED_BYTE, // type
        pixels,           // pixel data
    );
    // we don't need any filtering
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 0);
    return tex;
}

function isVoxelSolid(pos) {
    return getVoxel(pos).solid;
}

function getVoxel(pos) {
    
    var chunkPosition = pos.map(x => Math.floor(x/chunksize));
    var blockPosition = pos.map(x => mod(x,chunksize));

    if (!chunks.has(chunkPosition.toString())) return true;
    var chunk = chunks.get(chunkPosition.toString());
    if (chunk.loadstate == LOAD_WAIT) return true;
    return chunk.chunkID[blockPosition[0]][blockPosition[1]][blockPosition[2]];

    /*var p = pos.map(x => x*0.4);

    var p2 = p.slice();

    p[0] = Math.cos(p2[0]*.2739 + 3.0*Math.sin(0.5*p2[2]));
    p[1] = Math.cos(p2[1]*.2739 + 3.0*Math.sin(0.5*p2[0]));
    p[2] = Math.cos(p2[2]*.2739 + 3.0*Math.sin(0.5*p2[1]));
    
    var n = p[1]+p[0]+p[2];//p.reduce((acc,val) => acc+val);
    
    //var a = pos.reduce((acc,x) => acc + Math.sin(x*1.4))/3-1;

    return n > Math.max(pos[1]*0.1,-2);*/


    /*var a = Terrain([pos[0],pos[2]]);
    return a > pos[1];*/
}

function pixelToUv(pixel) {
    if (mouseLock) return [0,0];
    return [(pixel[0]*2.0-canvas.width)/canvas.height,-pixel[1]/canvas.height*2.0+1.0];
}

function uvToRay(uv) {
    var trans = m3.identity();
    trans = m3.yRotate(trans, rot[0]);
    trans = m3.xRotate(trans, rot[1]);

    var rd = [uv[0],uv[1],-1];
    
    var len = 1.0/Math.sqrt(dot2(rd));
    rd = rd.map(x => x*len);
    rd = m3.transformVector(trans,rd);
    
    return rd;
}

function castRay(ro, rd, maxlen) {
    var ird = rd.map(x => Math.abs(1.0/x));
    var srd = rd.map(x => Math.sign(x));
    
    var fro = ro.map(x => Math.floor(x));
    var lro = map2([ro,fro], (x,y) => x-y);
    
    var lens = map2([lro,ird,srd], function(lro,ird,srd) {
        if (srd == 1) lro = 1-lro;
        return lro*ird;
    });

    var closest = 0;
    var didHit = false;
    var d = 0;
    for (var i = 0; i < 100; i++) {
        d = lens[closest]-ird[closest];
        if (isVoxelSolid(fro) || d > maxlen) {
            break;
        }
        
        if (lens[0] < lens[1] && lens[0] < lens[2])
            closest = 0;
        else if (lens[1] < lens[2])
            closest = 1;
        else
            closest = 2;

        fro[closest] += srd[closest];
        lens[closest] += ird[closest];
    }
    didHit = d <= maxlen;

    var normal = new Array(3).fill(0);
    normal[closest] = -srd[closest];
    var buildBlock = fro.slice();
    buildBlock[closest] -= srd[closest];
    return {
        d: d,
        didHit: didHit,
        face: closest*2+0.5-srd[closest]*0.5,
        closest: closest,
        hitBlock: fro,
        buildBlock: buildBlock,
        normal: normal
    }
}

function getFrustum(p) {
    if (!cameraMatrix2) return false;
    var p2 = p.map(x=>x);
    p2.push(1);
    var a = m4.transformVector(cameraMatrix2,p2);
    a[3] += chunksize;
    return a[0] > -a[3] && a[0] < a[3]
        && a[1] > -a[3] && a[1] < a[3]
        //|| dot2(map2([lastplayerchunk,p],(a,b) => (a-b/chunksize))) < 2.1
           ;
}