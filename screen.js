'use strict';

function resize() {
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;

    if (canvas.width  !== displayWidth ||
        canvas.height !== displayHeight) {

        canvas.width  = displayWidth;
        canvas.height = displayHeight;
    }
}