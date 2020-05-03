'use strict';

importScripts("boththreads.js");

var init = true;
var lastc;

const waterLevel = 10;

function fract(a) {
    if (typeof a == "number") {
        return a-Math.floor(a);
    }
    return a.map(x => x-Math.floor(x));
}

function floor(a) {
    if (typeof a == "number") {
        return Math.floor(a);
    }
    return a.map(x => Math.floor(x));
}

//  1 out, 2 in...
function Hash12(p)
{
	var p3  = fract([p[0],p[1],p[0]].map(x => x*0.1));
    var c = dot(p3, swizzle(p3.map(x => x + 19.19),[1,2,0]));
    var p4 = p3.map(x => x+c);
    var b = (p4[0] + p4[1]) * p4[2];
    var a = fract(b);
    return a;
}

function Noise(x)
{
    var p = floor(x);
    var f = fract(x);
    f = f.map(f => f*f*(3.0-2.0*f));
    
    var test = Hash12(p);

    var res = mix(mix(Hash12([p[0]+0,p[1]+0]), Hash12([p[0]+1,p[1]+0]),f[0]),
                  mix(Hash12([p[0]+0,p[1]+1]), Hash12([p[0]+1,p[1]+1]),f[0]),f[1]);
    return res;
}

function rotate2D(v) {
    const rot = [1.3623, 1.7531, -1.7131, 1.4623];
    return [v[0]*rot[0*2+0]+v[1]*rot[1*2+0],v[0]*rot[0*2+1]+v[1]*rot[1*2+1]];
}


function Terrain(p)
{
	var pos = p.map(x => x*0.05);
	var w = Noise(pos.map(x => x*0.25))*0.75+0.15;
    w = 66 * w * w;
    
	var f = 0;
	for (var i = 0; i < 5; i++)
	{
		f += w * Noise(pos);
		w = -w * 0.4;	//...Flip negative and positive for variation
		pos = rotate2D(pos);
	}
	var ff = Noise(pos.map(x => x*.002));
	
	f += Math.pow(Math.abs(ff), 5.0)*275-5;
	return f;
}

function buildChunk(chunk, s) {

    
    var chunkID = chunk.chunkID
    var data2 = [];
    var dataTransparent2 = [];
    
	for (var x = 0; x < s; x++) {
        for (var y = 0; y < s; y++) {
            for (var z = 0; z < s; z++) {
                if (isVoxelOpaque(chunkID[x][y][z])) {
                    if (!isVoxelOpaque(chunkID[x+1][y][z])) {
                        data2.push([x,y,z,1]);
                    }
                    if (!isVoxelOpaque(chunkID[x][y+1][z])) {
                        data2.push([x,y,z,3]);
                    }
                    if (!isVoxelOpaque(chunkID[x][y][z+1])) {
                        data2.push([x,y,z,5]);
                    }
                } else {
                    if (isVoxelOpaque(chunkID[x+1][y][z])) {
                        data2.push([x,y,z,0]);
                    }
                    if (isVoxelOpaque(chunkID[x][y+1][z])) {
                        data2.push([x,y,z,2]);
                    }
                    if (isVoxelOpaque(chunkID[x][y][z+1])) {
                        data2.push([x,y,z,4]);
                    }
                }
                if (isVoxelTransparent(chunkID[x][y][z])) {
                    if (isVoxelInvisible(chunkID[x+1][y][z])) {
                        dataTransparent2.push([x,y,z,1]);
                    }
                    if (isVoxelInvisible(chunkID[x][y+1][z])) {
                        dataTransparent2.push([x,y,z,3]);
                    }
                    if (isVoxelInvisible(chunkID[x][y][z+1])) {
                        dataTransparent2.push([x,y,z,5]);
                    }
                } else if (isVoxelInvisible(chunkID[x][y][z])) {
                    if (isVoxelTransparent(chunkID[x+1][y][z])) {
                        dataTransparent2.push([x,y,z,0]);
                    }
                    if (isVoxelTransparent(chunkID[x][y+1][z])) {
                        dataTransparent2.push([x,y,z,2]);
                    }
                    if (isVoxelTransparent(chunkID[x][y][z+1])) {
                        dataTransparent2.push([x,y,z,4]);
                    }
                }
            }
        }
    }
    
    var numquads = data2.length;

    var data = new Uint8Array(numquads*4);
    var textureNum = new Uint8Array(numquads*2);
    for (var i = 0; i < numquads; i++) {
        var d = data2[i];
        var p2 = [d[0],d[1],d[2]];
        if (d[3] == 0) p2[0]+=1;
        if (d[3] == 2) p2[1]+=1;
        if (d[3] == 4) p2[2]+=1;
        var p = chunkID[p2[0]][p2[1]][p2[2]].texturePosition;
        textureNum.set(p,i*2);
        data.set(d,i*4);
    }
    
    var numquadsTransparent = dataTransparent2.length;

    var dataTransparent = new Uint8Array(numquadsTransparent*4);
    var textureNumTransparent = new Uint8Array(numquadsTransparent*2);
    for (var i = 0; i < numquadsTransparent; i++) {
        var d = dataTransparent2[i];
        var p2 = [d[0],d[1],d[2]];
        if (d[3] == 0) p2[0]+=1;
        if (d[3] == 2) p2[1]+=1;
        if (d[3] == 4) p2[2]+=1;
        var p = chunkID[p2[0]][p2[1]][p2[2]].texturePosition;
        textureNumTransparent.set(p,i*2);
        dataTransparent.set(d,i*4);
    }
    
    chunk.data = data;
    chunk.textureNum = textureNum;
    chunk.quads = numquads;
    
    chunk.transparent = {
        data: dataTransparent,
        textureNum: textureNumTransparent,
        quads: numquadsTransparent,
    }

	return chunk;
}

function createChunk(center, s) {
    
    var c = center.map(x => x*s);
    
    var chunkID = new Array(s+1);
	for (var x = 0; x < s+1; x++) {
        chunkID[x] = new Array(s+1);
        for (var y = 0; y < s+1; y++) {
            chunkID[x][y] = new Array(s+1);
        }
    }

    for (var x = 0; x < s+1; x++) {
        for (var z = 0; z < s+1; z++) {
            var h = Terrain([c[0]+x,c[2]+z]);
            for (var y = 0; y < s+1; y++) {
                var y2 = c[1]+y
                if (y2 < h-3)//getvoxel([c[0]+x,c[1]+y,c[2]+z]);
                    chunkID[x][y][z] = blocks.stone;
                else if (y2 < h-1)
                    chunkID[x][y][z] = blocks.dirt;
                else if (y2 <= h)
                    chunkID[x][y][z] = blocks.grass;
                else if (y2 <= waterLevel) {
                    chunkID[x][y][z] = blocks.water;
                } else
                    chunkID[x][y][z] = blocks.air;
            }
        }
    }

    return buildChunk({
        center: center,
        chunkID: chunkID
    }, s);
}

function sendchunk(p) {
    postMessage(createChunk(p, chunksize));
}

function updateChunk(chunk) {
    postMessage(buildChunk(chunk, chunksize));
}

onmessage = function(e) {
    if (Array.isArray(e.data)) {
        var position = e.data;
        sendchunk(position);
    } else {
        var chunk = e.data;
        updateChunk(chunk);
    }
}