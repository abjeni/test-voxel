'use strict';

function resize() {
    var displayWidth  = window.innerWidth;
    var displayHeight = window.innerHeight;

    if (canvas.width  !== displayWidth ||
        canvas.height !== displayHeight) {

        canvas.width  = displayWidth;
        canvas.height = displayHeight;
    }
}