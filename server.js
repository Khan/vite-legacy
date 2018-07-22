#!/usr/bin/env node

const express = require("express");
const fs = require("fs");
const path = require("path");
const PNGCrop = require("png-crop");
const child_process = require("child_process");
const robot = require("robotjs");
const {transform} = require("sucrase");
const glob = require("glob");
const matchAll = require("match-all");
const commandExists = require("command-exists").sync;

const cjs2es = require("./cjs2es.js");

const app = express();

app.use(express.json());

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

app.post("/simulate", (req, res) => {
    const {offsetX, offsetY, event} = req.body;

    if (event.type === "mousemove") {
        robot.moveMouse(event.clientX + offsetX, event.clientY + offsetY);
        res.send("okay");
    } else if (event.type === "mousedown") {
        robot.mouseToggle("down");
        res.send("okay");
    } else if (event.type === "mouseup") {
        robot.mouseToggle("up");
        res.send("okay");
    } else if (event.type === "click") {
        robot.mouseToggle("down");
        robot.mouseToggle("up");
        res.send("okay");
    } else if (event.type === "keydown") {
        robot.keyToggle(event.key, "down");
        res.send("okay");
    } else if (event.type === "keyup") {
        robot.keyToggle(event.key, "up");
        res.send("okay");
    } else if (event.type === "keypress") {
        robot.keyToggle(event.key, "down");
        robot.keyToggle(event.key, "up");
        res.send("okay");
    }
});

let screenshotCmd = null;
if (commandExists("screencapture")) {
    screenshotCmd = "screencapture";
} else if (commandExists("import")) {
    screenshotCmd = "import";
}

const config = require(path.join(process.cwd(), "config.json"));

app.post("/screenshot", (req, res) => {
    const {bounds} = req.body;
    const filename = path.join(process.cwd(), config.screenshots, req.body.filename);
    const {x, y, width, height} = bounds;

    let cmd = null;
    if (screenshotCmd === "screencapture") {
        cmd = `${screenshotCmd} -R${x},${y},${width},${height} ${filename}`;
    } else if (screenshotCmd === "import") {
        cmd = `${screenshotCmd} -window root -crop ${width}x${height}+${x}+${y} ${filename}`;
    } else {
        res.status(500);
        res.end();
    }

    console.log(`saving: ${req.body.filename}`);
    console.log(bounds);

    child_process.exec(cmd, (err, stdout, stderr) => {
        if (err) {
            res.send("failed");
        } else {
            res.send(`screenshot saved to ${req.body.filename}`);
        }
    });
});

const modules = {};

// compile node modules on the fly to ES6 modules
app.get("/node_modules/:module", (req, res) => {
    const name = req.params.module;
    const filename = path.join('node_modules', name);

    if (!fs.existsSync(filename)) {
        console.log(`${filename} doesn't exist`);
        res.status(404);
        res.end();
    }

    console.log(`serving: ${name}`);
    if (name in modules) {
        res.type('js');
        res.send(modules[name]);
    } else {
        // TODO(kevinb): update cached module if code changes
        cjs2es(req.params.module).then(code => {
            res.type('js');
            res.send(code);
            modules[name] = code;
        });
    }
});

app.get("/node_modules/:scope/:module", (req, res) => {
    const name = req.params.module;
    const scope = req.params.scope;
    const filename = path.join('node_modules', scope, name);

    if (!fs.existsSync(filename)) {
        console.log(`${filename} doesn't exist`);
        res.status(404);
        res.end();
    }

    console.log(`serving: ${scope}/${name}`);
    if (name in modules) {
        res.type('js');
        res.send(modules[`${scope}/${name}`]);
    } else {
        // TODO(kevinb): update cached module if code changes
        cjs2es(`${scope}/${name}`).then(code => {
            res.type('js');
            res.send(code);
            modules[`${scope}/${name}`] = code;
        });
    }
});

app.get('/fixtures', (req, res) => {
    const fixtures = fs.readdirSync(config.fixtures);
    console.log(`fixtures: ${fixtures.join(', ')}`);

    res.type('json');
    res.send(fixtures);
});

app.get('/fixtures/*.js', (req, res) => {
    const filename = path.join(
        config.fixtures, 
        path.relative('fixtures', req.path.slice(1)),
    );

    if (!fs.existsSync(filename)) {
        console.log(`${filename} doesn't exist`);
        res.status(404);
        res.end();
    }

    // TODO(kevinb): cache compiled code and update cache when code changes
    console.log(`serving: ${filename}`);
    const fixture = fs.readFileSync(filename).toString();
    
    src = [
        `\nimport * as React from "react";`,
        fixture,
    ].join('\n');

    // rewrite imports of node modules to be imports from /node_modules/<module_name>
    const code = src.replace(/from\s+\"([^\"\.\/][^\"]+)\"/g, (match, group1, offset, string) => {
        return `from "/node_modules/${group1}"`;
    });

    const compiledCode = transform(code, {transforms: ['jsx', 'flow']}).code;
    res.type('js');
    res.send(compiledCode);
});

// compile all JS files with sucrase to get convert JSX to plain JS
app.get('*.js', (req, res) => {
    const filename = req.path.slice(1);
    console.log(filename);

    if (!fs.existsSync(filename)) {
        console.log(`${filename} doesn't exist`);
        res.status(404);
        res.end();
    }

    // TODO(kevinb): cache compiled code and update cache when code changes
    console.log(`serving: ${filename}`);
    const src = fs.readFileSync(filename).toString();

    // rewrite imports of node modules to be imports from /node_modules/<module_name>
    const code = src.replace(/from\s+\"([^\"\.\/][^\"]+)\"/g, (match, group1, offset, string) => {
        return `from "/node_modules/${group1}"`;
    });

    const compiledCode = transform(code, {transforms: ['jsx', 'flow']}).code;
    res.type('js');
    res.send(compiledCode);
})

// put static routing last to take care of .html files
app.use(express.static("."));

app.listen(3000, () => console.log("listening on port 3000"));
