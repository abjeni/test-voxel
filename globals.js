'use strict';

const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2");

var keys = new Array(256).fill(false);

var rot = [0,0];
//var pos = [1.5,10,24.5];
var pos =  [-30,1.4,0];
var frot = rot.slice();
var fpos = pos.slice();

var movespeed = 3;
var fmovespeed = 10;
var time = 0;

var playersize = 0.2;

var reach = 5;

var selectedblock = 2;

var testcubes = [];

var cameraMatrix2 = false;

const imageSize = 128;