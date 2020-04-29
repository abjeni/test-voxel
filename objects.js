'use strict';

function getcubedata() {
    const normals2 = [
        0.0,  0.0, -1.0,
        0.0,  0.0,  1.0,
        0.0, -1.0,  0.0,
        0.0,  1.0,  0.0,
       -1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
    ];

    var normals = new Float32Array(72);

    for (var a = 0; a < 6; a++) {
        for (var b = 0; b < 4; b++) {
            for (var c = 0; c < 3; c++) {
                normals[a*4*3+b*3+c] = normals2[a*3+c];
            }
        }
    }

    const positions = new Float32Array([
        0, 0, 0,
        0, 1, 0,
        1, 0, 0,
        1, 1, 0,

        0, 0, 1,
        1, 0, 1,
        0, 1, 1,
        1, 1, 1,

        0, 0, 0,
        1, 0, 0,
        0, 0, 1,
        1, 0, 1,

        0, 1, 0,
        0, 1, 1,
        1, 1, 0,
        1, 1, 1,

        0, 0, 0,
        0, 0, 1,
        0, 1, 0,
        0, 1, 1,

        1, 0, 0,
        1, 1, 0,
        1, 0, 1,
        1, 1, 1,
    ]);

    /* 0,2,4,5,   1,6,3,7,   0,4,1,6,   2,3,5,7 */

    const indices2 = [
    0,1,2,1,3,2
];

    var indices = new Uint16Array(36);

    for (var i = 0; i < 6; i++) {
        for (var j = 0; j < 6; j++) {
            indices[i*6+j] = indices2[j]+i*4;
        }
    }
    
    return {
        attribs: {
            a_position: {data: positions, size: 3, normalize: false, type: gl.FLOAT},
            a_normal: {data:normals, size: 3, normalize: false, type: gl.FLOAT}
        },
        indices: indices,
        program: "character",
        count: 36
    }
}

function vao(data) {
    
    this.vao = gl.createVertexArray();
    this.program = data.program;
    this.count = data.count;
    gl.bindVertexArray(this.vao);
    
    this.attribs = {};
    
    for (var attribname in data.attribs) {

        var attrib = data.attribs[attribname];
        attrib.location = gl.getAttribLocation(programs[this.program].program,  attribname);
        
        gl.enableVertexAttribArray(attrib.location);

        attrib.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, attrib.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, attrib.data, gl.STATIC_DRAW);
        
        var size = attrib.size;
        var type = attrib.type;
        var normalize = attrib.normalize;
        var stride = 0;
        var offset = 0;
        gl.vertexAttribPointer(
            attrib.location, size, type, normalize, stride, offset);
        
        this.attribs[attribname] = attrib;
    }
    
    this.indices = data.indices;
    this.indiceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indiceBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
}

var vaos = {
    cube: new vao(getcubedata()),
}