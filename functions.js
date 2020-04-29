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

function getfrustum(p) {
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

function chunkindex3(p) {
    const a = rdist*2+1;
    p = p.map(x => mod(x+rdist,a));
	return p[0]+p[1]*a+p[2]*a*a;
}