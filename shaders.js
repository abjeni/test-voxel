'use strict';

var voxelVertexShaderSource =
`#version 300 es

    precision mediump float;
    
    uniform mat4 u_proj;
    uniform vec3 u_centerPosition;
    uniform float u_time;
    uniform lowp usampler2D u_data;
    uniform lowp usampler2D u_texpos;

    out vec3 v_position;
    out vec3 v_normal;
    out vec2 uv;
    
    ivec2 gettexel(uint index) {
        uint texWidth = uint(textureSize(u_data, 0).x);
        uint col = index % texWidth;
        uint row = index / texWidth;
        return ivec2(col,row);
    }

    uvec4 getdata1(ivec2 texel) {
        return texelFetch(u_data, texel, 0);
    }

    uvec2 getdata2(ivec2 texel) {
        return texelFetch(u_texpos, texel, 0).xy;
    }

    void main() {
        
        vec3 wpos = vec3(0);
        
        uint numquad = uint(gl_VertexID)/6u;

        ivec2 texel = gettexel(numquad);
        uvec4 data = getdata1(texel);
        uvec2 texpos = getdata2(texel);

        uint quadid = uint(3-abs(gl_VertexID%6-3));
        uint nori = data.w%6u;
        
        //float n = float(numquad*4u+quadid);
        //wpos += sin(n*vec3(0.5,0.35,0.8)+u_time*vec3(2.0,5.4,0.3)*0.1);

        if (nori == 6u) {
            gl_Position = vec4(0,0,0,1);
            return;
        }

        uint diri = nori&1u;
        uint compi = nori/2u;

        //quadid = quadid ^ diri;

        vec2 quad = vec2(quadid&1u,(quadid>>1u)&1u);
        uv = quad/2.0+vec2(texpos)*0.5;
        if (diri == 0u) quad.xy = quad.yx;

        vec3 nor = vec3(0);
        nor[compi] = float(diri)*2.0-1.0;
        
        wpos[(compi+1u)%3u] += quad.x;
        wpos[(compi+2u)%3u] += quad.y;
        wpos[compi] += 1.0;

        wpos += vec3(data.xyz);
        //wpos += float(gl_VertexID/6);
        wpos += u_centerPosition;

        v_position = wpos;
        v_normal = nor;
        
        gl_Position = u_proj * vec4(wpos,1);
    }
`;
 
var voxelFragmentShaderSource =
`#version 300 es

    precision mediump float;
    
    in vec3 v_position;
    in vec3 v_normal;
    in vec2 uv;
    uniform lowp sampler2D u_grass;
    
    uniform vec3 u_lightPosition;
    uniform vec3 u_cameraPosition;
    
    out vec4 outColor;
    
    void main() {
        
        vec3 color = texture(u_grass, clamp(uv,0.0,1.0)).xyz;
        
        float fog = clamp((v_position.y+10.0)*0.05,0.2,1.0);

        color *= fog;

        outColor = vec4(color,1);
        
    }
`;

var characterVertexShaderSource =
`#version 300 es

    precision mediump float;

    in vec4 a_position;
    in vec3 a_normal;
    
    uniform mat4 u_proj;
    uniform mat4 u_world;
	
    out vec3 v_position;
    out vec3 v_normal;
    
    void main() {
        vec3 wpos = vec3(u_world*a_position);
        v_position = wpos;
        v_normal = a_normal;
        
        gl_Position = u_proj * vec4(wpos,1);
    }
`;
 
var characterFragmentShaderSource =
`#version 300 es

    precision mediump float;
    
    in vec3 v_position;
    in vec3 v_normal;

    uniform vec3 u_lightPosition;
    uniform vec3 u_cameraPosition;
    
    out vec4 outColor;
    
    void main() {
        //vec3 color = v_normal*0.5+0.5;
        vec3 color = v_normal*0.25+0.75;
        
        outColor = vec4(color,1);
        
    }
`;

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

var shaders = {
    vertexVoxel: createShader(gl, gl.VERTEX_SHADER, voxelVertexShaderSource),
    fragmentVoxel: createShader(gl, gl.FRAGMENT_SHADER, voxelFragmentShaderSource),
    vertexCharacter: createShader(gl, gl.VERTEX_SHADER, characterVertexShaderSource),
    fragmentCharacter: createShader(gl, gl.FRAGMENT_SHADER, characterFragmentShaderSource)
}

function program(vertexShader, fragMentShader, uniforms) {
    this.program = createProgram(gl, vertexShader, fragMentShader);
    
    this.uniforms = {};
    for (var i = 0; i < uniforms.length; i++) {
        this.uniforms[uniforms[i]] = gl.getUniformLocation(this.program, uniforms[i]);
    }
}

var programs = {
    voxel: new program(shaders.vertexVoxel, shaders.fragmentVoxel, [
        "u_lightPosition", "u_cameraPosition", "u_centerPosition",
        "u_proj", "u_time", "u_data", "u_texpos", "u_grass", "u_rdist"
    ]),
    character: new program(shaders.vertexCharacter,shaders.fragmentCharacter, [
        "u_lightPosition", "u_cameraPosition", "u_centerPosition",
        "u_proj", "u_world"
    ])
}