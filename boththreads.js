'use strict';

function fract(a) {
    if (typeof a == "number") {
        return a-Math.floor(a);
    }
    return a.map(x => x-Math.floor(x));
}

function floor(a) {
    if (typeof a == "number") {
        return Math.floor(a);
    }
    return a.map(x => Math.floor(x));
}

//  1 out, 2 in...
function Hash12(p)
{
	var p3  = fract([p[0],p[1],p[0]].map(x => x*0.1));
    var c = dot(p3, swizzle(p3.map(x => x + 19.19),[1,2,0]));
    var p4 = p3.map(x => x+c);
    var b = (p4[0] + p4[1]) * p4[2];
    var a = fract(b);
    return a;
}

function Noise(x)
{
    var p = floor(x);
    var f = fract(x);
    f = f.map(f => f*f*(3.0-2.0*f));
    
    var test = Hash12(p);

    var res = mix(mix(Hash12([p[0]+0,p[1]+0]), Hash12([p[0]+1,p[1]+0]),f[0]),
                  mix(Hash12([p[0]+0,p[1]+1]), Hash12([p[0]+1,p[1]+1]),f[0]),f[1]);
    return res;
}

function Terrain(p)
{
	var pos = p.map(x => x*0.2);
	var w = Noise(pos.map(x => x*0.25))*0.75+0.15;
    w = 66 * w * w;
    
	var f = 0;
	for (var i = 0; i < 5; i++)
	{
		f += w * Noise(pos);
		w = -w * 0.4;	//...Flip negative and positive for variation
		//pos = rotate2D * pos;
	}
	var ff = Noise(pos.map(x => x*.002));
	
	f += Math.pow(Math.abs(ff), 5.0)*275-5;
	return f;
}

function getvoxel(pos) {
    
    var chunkPosition = pos.map(x => Math.floor(x/chunksize));
    var blockPosition = pos.map(x => mod(x,chunksize));

    if (!chunks.has(chunkPosition.toString())) return true;
    var chunk = chunks.get(chunkPosition.toString());
    if (chunk.loadstate == LOAD_WAIT) return true;
    return chunk.chunkID[blockPosition[0]][blockPosition[1]][blockPosition[2]];

    /*var p = pos.map(x => x*0.4);

    var p2 = p.slice();

    p[0] = Math.cos(p2[0]*.2739 + 3.0*Math.sin(0.5*p2[2]));
    p[1] = Math.cos(p2[1]*.2739 + 3.0*Math.sin(0.5*p2[0]));
    p[2] = Math.cos(p2[2]*.2739 + 3.0*Math.sin(0.5*p2[1]));
    
    var n = p[1]+p[0]+p[2];//p.reduce((acc,val) => acc+val);
    
    //var a = pos.reduce((acc,x) => acc + Math.sin(x*1.4))/3-1;

    return n > Math.max(pos[1]*0.1,-2);*/


    /*var a = Terrain([pos[0],pos[2]]);
    return a > pos[1];*/
}

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