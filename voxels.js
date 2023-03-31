'use strict';

importScripts("voxelgeometry.js");

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
                var y2 = c[1]+y;
                if (y2 < h-3)//getvoxel([c[0]+x,c[1]+y,c[2]+z]);
                    chunkID[x][y][z] = blocks.stone;
                else if (y2 < h-1 || (y2 <= waterlevel && y2 <= h))
                    chunkID[x][y][z] = blocks.dirt;
                else if (y2 <= h)
                    chunkID[x][y][z] = blocks.grass;
//                else if (y2 <= waterLevel) {
//                    chunkID[x][y][z] = blocks.water;
                } else
                    chunkID[x][y][z] = blocks.air;
            }
        }
    }

    return {
        center: center,
        chunkID: chunkID
    };
}

function sendchunk(p) {
    var chunk = createChunk(p, chunksize);
    var geometry = buildChunk(chunk.chunkID, chunksize);
    postMessage([chunk, geometry]);
}

onmessage = function(e) {
    var position = e.data;
    sendchunk(position);
}
