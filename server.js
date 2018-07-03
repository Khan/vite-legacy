const express = require("express");
const fs = require("fs");
const path = require("path");
const PNGCrop = require("png-crop");
var robot = require("robotjs");

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

// Speed up the mouse.
robot.setMouseDelay(10);

app.post("/playback", (req, res) => {
    res.send("okay");

    const {offsetX, offsetY} = req.body;
    const event = req.body.events[0];
    robot.moveMouse(event.clientX + offsetX, event.clientY + offsetY);

    for (const event of req.body.events) {
        switch (event.type) {
            case "mousedown":
                robot.mouseToggle("down");
                break;
            case "mouseup":
                robot.mouseToggle("up");
                break;
            case "mousemove":
                robot.moveMouse(event.clientX + offsetX, event.clientY + offsetY);
                break;
            default:
                break;
        }
    }
});

app.listen(3000, () => console.log("listening on port 3000"));
