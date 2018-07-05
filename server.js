const express = require("express");
const fs = require("fs");
const path = require("path");
const PNGCrop = require("png-crop");
const child_process = require("child_process");
const robot = require("robotjs");

const app = express();

app.use(express.static("."));
app.use(express.json({limit: '5mb'}));

app.post("/screenshot", (req, res) => {
    const data = req.body.dataUrl.replace(/^data:image\/png;base64,/, "");
    const filename = path.join(__dirname, "screenshots", req.body.filename);

    const imgBuf = new Buffer(data, 'base64');
    const bounds = req.body.bounds;

    // we multiply by two since we're on a retina display
    const config = {
        width: 2 * bounds.width,
        height: 2 * bounds.height,
        top: 2 * bounds.top,
        left: 2 * bounds.left,
    };
    
    PNGCrop.cropToStream(imgBuf, config, (err, outputStream) => {
        if (err) throw err;
        outputStream.pipe(fs.createWriteStream(filename));
        console.log("wrote file");
    });

    res.send("okay");
});

// Speed up the mouse and keyboard
robot.setMouseDelay(0);
robot.setKeyboardDelay(0);

const modifiers = {
    shift: false,
    alt: false,
    control: false,
}
let shift = false;

const getActiveModifiers = () => {
    return Object.keys(modifiers).filter(key => modifiers[key]);
}

const mouseDelay = 100;
const keyboardDelay = 500;

const sleep = async (duration) => 
    new Promise((resolve, reject) =>
        setTimeout(resolve, duration));

const playback = async (events, offsetX, offsetY) => {
    for (const event of events) {
        switch (event.type) {
            case "mousedown":
                robot.moveMouse(event.clientX + offsetX, event.clientY + offsetY);
                robot.mouseToggle("down");
                await sleep(mouseDelay);
                break;
            case "mouseup":
                robot.moveMouse(event.clientX + offsetX, event.clientY + offsetY);
                robot.mouseToggle("up");
                await sleep(mouseDelay);
                break;
            case "mousemove":
                robot.moveMouse(event.clientX + offsetX, event.clientY + offsetY);
                await sleep(mouseDelay);
                break;
            case "keydown":
                // TODO(kevinb): add a formal debug mode
                console.log(`${event.key} down`);
                if (event.key in modifiers) {
                    modifiers[event.key] = true;
                } else {
                    robot.keyToggle(event.key, "down", getActiveModifiers());
                }
                await sleep(keyboardDelay);
                break;
            case "keyup":
                console.log(`${event.key} up`);
                if (event.key in modifiers) {
                    modifiers[event.key] = false;
                } else {
                    robot.keyToggle(event.key, "up", getActiveModifiers());
                }
                await sleep(keyboardDelay);
            default:
                break;
        }
    }
}

app.post("/playback", (req, res) => {
    const {offsetX, offsetY} = req.body;

    playback(req.body.events, offsetX, offsetY).then(() => {
        res.send("okay");
    });
});

app.post("/screenshot2", (req, res) => {
    const {bounds, filename} = req.body;
    const path = `screenshots/${filename}`;
    const {x, y, width, height} = bounds;
    console.log(`saving: ${path}`);
    console.log(bounds);
    // TODO(kevinb): use shutter on linux
    const cmd = `screencapture -R${x},${y},${width},${height} ${path}`;
    console.log(cmd);
    child_process.exec(cmd, (err, stdout, stderr) => {
        if (err) {
            res.send("failed");
        } else {
            res.send(`screenshot saved to ${path}`);
        }
    });
});

app.listen(3000, () => console.log("listening on port 3000"));
