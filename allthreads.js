'use strict';

function mod(a,b) {
    return ((a%b)+b)%b;
}

function swizzle(a, b) {
    return b.map(i => a[i]);
}

function dot2(a) {
    var a = a.map(x => (x*x))
    return a.reduce((acc,x) => acc+x);
}

function dot(a, b) {
    var mul = map2([a,b], (a,b) => (a*b));
    return mul.reduce((acc, x) => acc+x);
}

function mix(a,b,m) {
    return a+(b-a)*m;
}

function map2(lists, calc) {
    var len = lists[0].length;
    var components = lists.length;
    var result = new Array(len);
    for (var i = 0; i < len; i++) {
        var comps = [];
        for (var j = 0; j < components; j++) {
            comps[j] = lists[j][i];
        }
        result[i] = calc.apply(null,comps);
    }
    return result;
}

function isVoxelOpaque(block) {
    return block.opacity == 1;
}

function isVoxelInvisible(block) {
    return block.opacity == 0;
}

function isVoxelTransparent(block) {
    var opacity = block.opacity;
    return opacity > 0 && opacity < 1;
}

function block(texturePosition) {
    this.texturePosition = texturePosition;
    this.opacity = 1;
    this.solid = true;
}

var blocks = {
    air:   new block([0,0]),
    grass: new block([0,0]),
    dirt:  new block([1,0]),
    stone: new block([0,1]),
    water: new block([1,1])
};

var blockNumbers = [];

Object.keys(blocks).forEach(function (blockName) {
	blockNumbers.push(blockName);
});

blocks.air.opacity = 0.0;
blocks.air.solid = false;

blocks.water.opacity = 0.5;
blocks.water.solid = false;


const rdist = 8;
const chunksize = 32;

const GET_CHUNK = 0;
const NEW_CENTER_CHUNK = 1;
const SET_BLOCKS = 2;
const UPDATE_NEAR_CHUNKS = 3;
const UPDATE_NEAR_CHUNK = 4;

const LOAD_NO   = 0;
const LOAD_DONE = 1
const LOAD_WAIT = 2;