/**
 * simple drawing app that posts events from each stroke to a 
 * server which plays them back using robot.js.
 */
document.body.style.margin = "0";

const canvas = document.createElement("canvas");
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

document.body.appendChild(canvas);

let down = false;
let prevPoint = null;
let events = [];

let playback = false;

document.addEventListener("mousedown", (e) => {
    ctx.strokeStyle = randomColor();
    if (playback) {
        console.log(e);
    }
    console.log(`down = ${down}`);
    down = true;
    prevPoint = {x: e.clientX, y: e.clientY};
    events = [{
        type: "mousedown",
        clientX: e.clientX,
        clientY: e.clientY,
    }];
});

document.addEventListener("mousemove", (e) => {
    if (down) {
        const point = {x: e.clientX, y: e.clientY};
        events.push({
            type: "mousemove",
            clientX: e.clientX,
            clientY: e.clientY,
        });
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        prevPoint = point;
    }
});

document.addEventListener("mouseup", (e) => {
    if (playback) {
        console.log(e);
    }
    if (down) {
        const point = {x: e.clientX, y: e.clientY};
        events.push({
            type: "mouseup",
            clientX: e.clientX,
            clientY: e.clientY,
        });
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        prevPoint = point;

        down = false;

        if (!playback) {
            setTimeout(() => {
                playback = true;
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
                    console.log("playback started");
                });
            }, 100);
        } else {
            playback = false;
        }
    }
});
