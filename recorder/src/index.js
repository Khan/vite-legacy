/**
 * simple drawing app that posts events from each stroke to a 
 * server which plays them back using robot.js.
 */
document.body.style.margin = "0";

const canvas = document.querySelector("#canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.display = "block";
const ctx = canvas.getContext("2d");

ctx.lineWidth = 5;
ctx.lineCap = "round";

const randomColor = () => {
    const r = (255 * Math.random()) | 0;
    const g = (255 * Math.random()) | 0;
    const b = (255 * Math.random()) | 0;
    return `rgb(${r}, ${g}, ${b})`;
}

let down = false;
let prevPoint = null;

document.addEventListener("mousedown", (e) => {
    ctx.strokeStyle = randomColor();
    down = true;
    prevPoint = {x: e.clientX, y: e.clientY};
});

document.addEventListener("mousemove", (e) => {
    if (down) {
        const point = {x: e.clientX, y: e.clientY};
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        prevPoint = point;
    }
});

document.addEventListener("mouseup", (e) => {
    if (down) {
        const point = {x: e.clientX, y: e.clientY};
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        prevPoint = point;

        down = false;
    }
});

const square = document.querySelector("#square");
square.addEventListener("mouseenter", () => {
    square.style.backgroundColor = "magenta";
});

square.addEventListener("mouseleave", () => {
    square.style.backgroundColor = "cyan";
});

square.addEventListener("mousedown", () => {
    square.style.backgroundColor = "yellow";
});

square.addEventListener("mouseup", () => {
    square.style.backgroundColor = "magenta";
});

let capsLock = false;
let events = [];

const h1 = document.querySelector("h1");

document.addEventListener("keydown", (e) => {
    console.log(e.keyCode);
    if (e.keyCode === 20) {
        capsLock = true;
        events = [];
        h1.innerText = "RECORD";
    } else if (e.keyCode === 16) {
        events.push({
            type: "keydown",
            key: "shift",
        });
    } else if (e.keyCode === 9) {
        events.push({
            type: "keydown",
            key: "tab",
        });
    }
});

document.addEventListener("keyup", (e) => {
    if (capsLock && e.keyCode === 20) {
        console.log(`capsLock = ${capsLock}`);
        console.log(events);
        capsLock = false;

        h1.innerText = "STANDBY";

        setTimeout(() => {
            h1.innerText = "PLAYBACK";

            fetch("http://localhost:3000/playback", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    offsetX: window.screenX,
                    offsetY: window.screenY + (window.outerHeight - window.innerHeight),
                    events: events,
                }),
            }).then(() => {
                h1.innerText = "STANDBY";
            });
        }, 500);

    } else if (e.keyCode === 16) {
        events.push({
            type: "keyup",
            key: "shift",
        });
    } else if (e.keyCode === 9) {
        events.push({
            type: "keyup",
            key: "tab",
        });
    }
});

document.addEventListener("mousemove", (e) => {
    if (capsLock) {
        events.push({
            type: "mousemove",
            clientX: e.clientX,
            clientY: e.clientY,
        });
    }
});

document.addEventListener("mousedown", (e) => {
    if (capsLock) {
        events.push({
            type: "mousedown",
            clientX: e.clientX,
            clientY: e.clientY,
        });
    }
});

document.addEventListener("mouseup", (e) => {
    if (capsLock) {
        events.push({
            type: "mouseup",
            clientX: e.clientX,
            clientY: e.clientY,
        });
    }
});

let i = 0;
const takeScreenshot = (element) => {
    const bounds = element.getBoundingClientRect();
    const titlebarHeight = window.outerHeight - window.innerHeight;

    fetch("http://localhost:3000/screenshot", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename: `square_${i++}.png`,
            bounds: {
                x: window.screenX + bounds.left,
                y: window.screenY + titlebarHeight + bounds.top,
                width: bounds.width,
                height: bounds.height,
            },
        }),
    })
}

// take initial screenshot on page load
takeScreenshot(square);

// take additional screenshots on DOM mutations
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        takeScreenshot(square);
    });
});

const config = { attributes: true, childList: true, characterData: true }

observer.observe(square, config);
