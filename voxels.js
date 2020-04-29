'use strict';

importScripts("boththreads.js");

var init = true;
var lastc;

function buildChunk(chunk, s) {

    
    var chunkID = chunk.chunkID
    var data2 = [];
    
	for (var x = 0; x < s; x++)
        for (var y = 0; y < s; y++)
            for (var z = 0; z < s; z++)
                
                if (chunkID[x][y][z] != 0) {
                    if (!chunkID[x+1][y][z] != 0) {
                        data2.push([x,y,z,1]);
                    }
                    if (!chunkID[x][y+1][z] != 0) {
                        data2.push([x,y,z,3]);
                    }
                    if (!chunkID[x][y][z+1] != 0) {
                        data2.push([x,y,z,5]);
                    }
                } else {
                    if (chunkID[x+1][y][z] != 0) {
                        data2.push([x,y,z,0]);
                    }
                    if (chunkID[x][y+1][z] != 0) {
                        data2.push([x,y,z,2]);
                    }
                    if (chunkID[x][y][z+1] != 0) {
                        data2.push([x,y,z,4]);
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
        var p = blocks[chunkID[p2[0]][p2[1]][p2[2]]].texturePosition;
        textureNum.set(p,i*2);
        data.set(d,i*4);
    }
    
    chunk.data = data;
    chunk.textureNum = textureNum;
    chunk.quads = numquads;

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
                    chunkID[x][y][z] = 3;
                else if (y2 < h-1)
                    chunkID[x][y][z] = 2;
                else if (y2 <= h)
                    chunkID[x][y][z] = 1;
                else
                    chunkID[x][y][z] = 0;
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