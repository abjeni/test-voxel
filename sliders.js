'use strict';

var ui = document.createElement("DIV");
ui.setAttribute("id", "uiContainer");
document.body.appendChild(ui);

function slider(min, max, def) {
    this.input = document.createElement("INPUT");
    this.input.setAttribute("type", "range");
    this.input.setAttribute("min", min.toString());
    this.input.setAttribute("max", max.toString());
    this.input.setAttribute("value", def.toString());
    this.input.setAttribute("step", "any");
    ui.appendChild(this.input);
    
    this.text = document.createElement("SPAN");
    ui.appendChild(this.text);
    
    this.break = document.createElement("BR");
    ui.appendChild(this.break);
    
    this.value = def;
    
    this.refresh = function(name) {
        var value = this.input.value;
        this.text.innerHTML = value+" "+name;
        this.value = parseFloat(value);
    }
}

function label() {
    this.label = document.createElement("SPAN");
    ui.appendChild(this.label);
    
    this.break = document.createElement("BR");
    ui.appendChild(this.break);

    this.lastfps = 60;
    this.count = 0;

    this.label.innerHTML = "wait";
}

var sliders = {
    fov: new slider(0,180,90)
};

var labels = {
    fps: new label(),
    time: new label(),
    block: new label(),
    mobile: new label()
};

labels.fps.refresh = function(data) {
    var framerate = 1/Math.max(data.deltaTime,1/1000);
    
    this.lastfps = this.lastfps*0.6+framerate*0.4;
    this.count++;
    
    if (this.count == 20) {
        this.label.innerHTML = "fps: "+Math.floor(this.lastfps*10)/10;
        this.count = 0;
    }
}

labels.time.refresh = function(data) {
    this.label.innerHTML = "time: "+Math.floor(data.time*10)/10;
}

labels.block.refresh = function(data) {
    this.label.innerHTML = "block: "+selectedblock;
}

var jumpButton = document.createElement("BUTTON");
ui.appendChild(jumpButton);
jumpButton.innerHTML = "JUMP";
ui.appendChild(document.createElement("BR"));
jumpButton.addEventListener("click", function() {
    jump();
});

/*labels.mobile.refresh = function(data) {
    if (lm) {
        this.label.innerHTML = lm;
    } else {
        this.label.innerHTML = "oh no";
    }
}*/

function updateinput() {
    for (var name in sliders) {
        if (sliders[name].refresh)
            sliders[name].refresh(name);
    }
}

function updateoutput(data) {
    for (var name in labels) {
        if (labels[name].refresh)
            labels[name].refresh(data);
    }
}
updateinput();

