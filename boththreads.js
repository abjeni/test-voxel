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



function block(name, texturePosition) {
    this.name = name;
    this.texturePosition = texturePosition;
}

var blocks = [
    new block("air", [0,0]),
    new block("grass", [0,0]),
    new block("dirt", [1,0]),
    new block("stone", [0,1])
];


const rdist = 8;
const chunksize = 16;