'use strict';

const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2");

var keys = new Array(256).fill(false);

var rot = [0,0];
//var pos = [1.5,10,24.5];
var pos =  [35.53913920192989, 7.4, 29.428023513512017];
var frot = rot.slice();
var fpos = pos.slice();

var movespeed = 3;
var fmovespeed = 30;
var time = 0;

var selectedblock = 2;

const imageSize = 128;

var testcubes = [];

var cameraMatrix2 = false;

const LOAD_NO   = 0;
const LOAD_DONE = 1
const LOAD_WAIT = 2;