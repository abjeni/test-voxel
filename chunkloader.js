'use strict';

importScripts("allthreads.js");

var loadingchunk = false;
var loadqueue = [];
var playerChunk;

var unloadedNearChunks;

var voxelWorker = new Worker('voxels.js');
var geometryWorker = new Worker('voxelgeometry.js');

var chunks = new Map();

voxelWorker.onmessage = function(e) {
    var chunk = e.data;
    chunks.set(chunk.center.toString(), chunk);
    
    var pos = chunk.center;
    if (map2([pos,playerChunk], (x,y) => x-y)
        .reduce((acc, x) => acc && x >= -1 && x <= 1)) {

        postMessage([UPDATE_NEAR_CHUNK,chunk]);
    }
}

function loadchunk(p) {
    if (!chunks.has(p.toString())) {
        chunks.set(p.toString(), {loadstate: LOAD_WAIT});
        loadqueue.push(p);
    }
}

function loadnext() {
    loadingchunk = true;

    var len = 9999999.0;
    var closest;
    var plr = playerChunk.slice();
    for (var i = 0; i < loadqueue.length; i++) {
        var chunk = loadqueue[i];
        var p = chunk.map(x => (x+0.5)*chunksize);
        
        var d = dot2(map2([p,plr],(p,plr) => p-plr));
        
        var a = (rdist+1)*chunksize;

        var error = !chunks.has(chunk.toString());
        if (!error) {
            error = chunks.get(chunk.toString()).loadstate != LOAD_WAIT;
        }

        if (d > a*a || error) {
            if (!error) {
                chunks.delete(chunk.toString());
            }

            if (i == loadqueue.length) {
                loadqueue.pop();
                break;
            }
            
            loadqueue[i] = loadqueue.pop();
            continue;
        }

        //if (!getFrustum(p)) d = d*3;
        
        if (d < len) {
            closest = i;
            len = d;
        }
    }

    if (closest !== undefined) {
        var chunkPos = loadqueue[closest];
        voxelWorker.postMessage(chunkPos);

        loadqueue[closest] = loadqueue[loadqueue.length-1];
        loadqueue.pop();
    } else {
        loadingchunk = false;
    }
}

onmessage = function(e) {
    var type = e.data[0];

    if (type == NEW_CENTER_CHUNK) {
        playerChunk = e.data[1];
        
        var nearChunks = new Array(3);
        for (var x = 0; x < 3; x++) {
            nearChunks[x] = new Array(3);
            for (var y = 0; y < 3; y++) {
                nearChunks[x][y] = new Array(3);
                for (var z = 0; z < 3; z++) {
                    var p = map2([[x,y,z],playerChunk], (p,pos) => p+pos-1);
                    var chunk = chunks.get(p.toString());
                    nearChunks[x][y][z] = chunk;

                    if (chunk == undefined) {
                        nearChunks[x][y][z] = {center: p}
                    }
                }
            }
        }

        this.postMessage([UPDATE_NEAR_CHUNKS,nearChunks]);
        
        for (var x = -rdist; x <= rdist; x++) {
            for (var y = -rdist; y <= rdist; y++) {
                for (var z = -rdist; z <= rdist; z++) {
                    var p = map2([[x,y,z],playerChunk], (p,pos) => p+pos);
                    loadchunk(p);
                }
            }
        }

        if (!loadingchunk) {
            loadnext();
        }
    } else if (type == GET_CHUNK) {
        var pos = e.data[1];
        postMessage([GET_CHUNK,chunks.get(pos.toString())]);
    }
}

/*function updateChunk(chunkPosition, blockPosition, setBlock) {

    var chunk = chunks.get(chunkPosition.toString());

    chunk.chunkID[blockPosition[0]][blockPosition[1]][blockPosition[2]] = setBlock;

    rebuildQueue.push({
        center: chunk.center,
        chunkID: chunk.chunkID
    });
}*/