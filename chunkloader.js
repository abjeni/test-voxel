var loadingchunk = false;
var loadqueue = [];
var rebuildQueue = [];

function loadchunk(p) {
    if (!chunks.has(p.toString())) {
        chunks.set(p.toString(), {loadstate: LOAD_WAIT});
        loadqueue.push(p);
    }
}

function loadnext() {
    loadingchunk = true;

    if (rebuildQueue.length > 0) {
        voxelWorker.postMessage(rebuildQueue.pop());
    }

    var len = 9999999.0;
    var closest;
    var plr = pos.slice();
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

        if (!getFrustum(p)) d = d*3;
        
        if (d < len) {
            closest = i;
            len = d;
        }
    }

    if (closest !== undefined) {
        var chunk = loadqueue[closest];
        voxelWorker.postMessage(chunk);

        loadqueue[closest] = loadqueue[loadqueue.length-1];
        loadqueue.pop();
    } else {
        loadingchunk = false;
    }
}

function loadchunks(pos) {
    
    for (var x = -rdist; x <= rdist; x++)
        for (var y = -rdist; y <= rdist; y++)
            for (var z = -rdist; z <= rdist; z++) {
                var p = map2([[x,y,z],pos], (p,pos) => p+pos);
                loadchunk(p);
            }
    if (!loadingchunk) {
        loadnext();
    }
}

function updateChunk(chunkPosition, blockPosition, setBlock) {

    var chunk = chunks.get(chunkPosition.toString());

    chunk.chunkID[blockPosition[0]][blockPosition[1]][blockPosition[2]] = setBlock;

    rebuildQueue.push({
        center: chunk.center,
        chunkID: chunk.chunkID
    });
}