'use strict';

importScripts("boththreads.js");

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