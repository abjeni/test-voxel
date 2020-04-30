var mouseclick = [-1,-1];

var lm = [0,0];


var freelook = false;

gl.enable(gl.CULL_FACE);

//console.log((rdist*2+1)*(rdist*2+1)*(rdist*2+1));
var chunks = new Map();

function updatechunk(chunk) {
    chunk.datatex = makeDataTexture(chunk.data, chunk.quads, 4, gl.RGBA8UI, gl.RGBA_INTEGER);
    chunk.texloc = makeDataTexture(chunk.textureNum, chunk.quads, 2, gl.RG8UI, gl.RG_INTEGER);
    chunk.loadstate = LOAD_DONE;

    chunks.set(chunk.center.toString(), chunk);
}

var voxelWorker = new Worker('voxels.js');

voxelWorker.onmessage = function(e) {
    var chunk = e.data;
    loadnext();
    updatechunk(chunk);
};

var lastplayerchunk = pos.map(x => Math.floor(x/chunksize));
loadchunks(lastplayerchunk);

isVec3Equal = (a,b) => a[0] == b[0] && a[1] == b[1] && a[2] == b[2]


function updatevoxels() {
    var playerchunk = pos.map(x => Math.floor(x/chunksize))
    
    if (!isVec3Equal(lastplayerchunk, playerchunk)) loadchunks(playerchunk)

    lastplayerchunk = playerchunk
}

function loadTexture() {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const levels = 1;
    const internalFormat = gl.RGBA8;
    const width = imageSize*2;
    const height = imageSize*2;
    gl.texStorage2D(gl.TEXTURE_2D, levels, internalFormat, width, height);

    return texture;
}

function addTexture(texture, url, p) {
    p = p.map(x => x*imageSize);
    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const level = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        console.log(image);
        gl.texSubImage2D(
            gl.TEXTURE_2D, level,
            p[0],p[1], imageSize, imageSize,
            srcFormat, srcType, image);
    };
    image.src = url;

    return texture;
}
  
var grasstexture = loadTexture();
addTexture(grasstexture, "grass.jpg", [0,0]);
addTexture(grasstexture, "dirt.jpg" , [1,0]);
addTexture(grasstexture, "stone.jpg" , [0,1]);
addTexture(grasstexture, "dirt.jpg" , [1,1]);


    
gl.enable(gl.DEPTH_TEST);

var then = 0.0;
function loop(now) {
    time = now/1000;
    
    var deltaTime = time-then;
    updateoutput({deltaTime: deltaTime, time: time});

    if (then == 0.0) deltaTime = 0.0;
	if (deltaTime > 0.05) deltaTime = 0.05;
    then = time;
    
    var res = [gl.canvas.clientWidth,gl.canvas.clientHeight];
    
    movement(deltaTime);
    
    resize();
    updateinput();
    
    updatevoxels();
    
    if (!loadingchunk) {
        loadnext();
    }
	
    var aspect = res[0] / res[1];
    var zNear = 0.1;
    var zFar = 2000;
    
    var p;
    var r;
    if (freelook) {
        p = fpos;
        r = frot;
    } else {
        p = pos;
        r = rot;
    }

    if (!freelook) {
        var uv = pixelToUv(lm);
        var rd = uvToRay(uv);
        var ro = pos;

        var rayCast = castRay(ro,rd, 5.0);

        testcubes[0] = rayCast.hitBlock;

        if (!rayCast.didHit) {
            testcubes = [];
        }
    }

    var cameraTransform = m4.translation(p);
    cameraTransform = m4.yRotate(cameraTransform, r[0]);
    cameraTransform = m4.xRotate(cameraTransform, r[1]);
    
    var viewMatrix = m4.inverse(cameraTransform);
    
    var cameraMatrix = m4.perspective(sliders.fov.value, aspect, zNear, zFar);
    cameraMatrix = m4.multiply(cameraMatrix,viewMatrix);

    var cameraTransform2 = m4.translation(pos);
    cameraTransform2 = m4.yRotate(cameraTransform2, rot[0]);
    cameraTransform2 = m4.xRotate(cameraTransform2, rot[1]);
    
    var viewMatrix2 = m4.inverse(cameraTransform2);
    
    cameraMatrix2 = m4.perspective(sliders.fov.value, aspect, zNear, zFar);
    cameraMatrix2 = m4.multiply(cameraMatrix2,viewMatrix2);
    
    if (!keys[84]) {
        cameraMatrix2 = cameraMatrix;
    }
    
    gl.viewport(0, 0, res[0], res[1]);
	
    gl.clearColor(0.5, 0.5, 0.5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
    var vao = vaos.cube;
	var program2 = programs.voxel;
	
	gl.useProgram(program2.program);
	
	gl.uniform1f(program2.uniforms.u_time, time);
	gl.uniform3fv(program2.uniforms.u_lightPosition, pos);
	gl.uniform3fv(program2.uniforms.u_cameraPosition, pos);
    gl.uniformMatrix4fv(program2.uniforms.u_proj, false, cameraMatrix);

    chunks.forEach((chunk, pos, map) => {
        if (chunk.loadstate == LOAD_DONE) {
            var center = chunk.center.map(x => x*chunksize);
            if (getfrustum(center.map(x => x+chunksize*0.5))) {
                gl.uniform3fv(program2.uniforms.u_centerPosition, center);

                gl.bindVertexArray(chunk.vao);

                gl.activeTexture(gl.TEXTURE0 + 0);
                gl.bindTexture(gl.TEXTURE_2D, chunk.datatex);
                gl.uniform1i(program2.uniforms.u_data, 0);
                
                gl.activeTexture(gl.TEXTURE0 + 1);
                gl.bindTexture(gl.TEXTURE_2D, chunk.texloc);
                gl.uniform1i(program2.uniforms.u_texpos, 1);
                
                gl.activeTexture(gl.TEXTURE0 + 2);
                gl.bindTexture(gl.TEXTURE_2D, grasstexture);
                gl.uniform1i(program2.uniforms.u_grass, 2);
                
                var primitiveType = gl.TRIANGLES;
                var count = chunk.quads*6;
                var offset = 0;
                gl.drawArrays(primitiveType, offset, count);
            }
        }
    });

	var vao = vaos.cube;
	var program2 = programs.character;
	
	gl.useProgram(program2.program);
    gl.bindVertexArray(vao.vao);

	gl.uniform3fv(program2.uniforms.u_lightPosition, pos);
    gl.uniform3fv(program2.uniforms.u_cameraPosition, pos);

    gl.uniformMatrix4fv(program2.uniforms.u_proj, false, cameraMatrix);
    
    var corner = pos.slice();
    corner[0] -= 0.1;
    corner[1] -= 1.4;
    corner[2] -= 0.1;
    var char2 = m4.translation(corner);
    char2 = m4.scale(char2, [0.2,1.5,0.2]);
    gl.uniformMatrix4fv(program2.uniforms.u_world, false, char2);

    var primitiveType = gl.TRIANGLES;
    var count = 36;
    var type = gl.UNSIGNED_SHORT;
    var offset = 0;
    gl.drawElements(primitiveType, count, type, offset);
    
    testcubes.forEach(function(cube) {
        var program2 = programs.boxFrame;
        gl.useProgram(program2.program);

        gl.uniformMatrix4fv(program2.uniforms.u_proj, false, cameraMatrix);
        gl.uniform3fv(program2.uniforms.u_position, cube);

        var primitiveType = gl.LINES;
        var count = 24;
        var offset = 0;
        gl.drawArrays(primitiveType, offset, count);
    });
    gl.flush();

	requestAnimationFrame(loop);
}

//updatechunks();

//fetch("shaderfragment.glsl").then((shaderString) => {

//    globalvar = shaderString;
requestAnimationFrame(loop);
//})

/*
fetch('https://developer.mozilla.org/en-US/docs/Learn')
.then(x => x.text())
.then(data => {
  olav = data
});
*/