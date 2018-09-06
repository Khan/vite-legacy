#!/usr/bin/env node
const express = require("express");
const fs = require("fs");
const path = require("path");
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

    child_process.exec(cmd, (err, stdout, stderr) => {
        if (err) {
            res.send("failed");
        } else {
            res.send(`screenshot saved to ${req.body.filename}`);
        }
    });
});

app.post("/log", (req, res) => {
    const {message} = req.body;
    console.log(message);
    res.send("okay");
});

const modules = {};

const serveModule = (res, name) => {
    const filename = name === "@khanacademy/vite-helpers"
        ? path.join(__dirname, "helpers.js")
        : path.join('node_modules', name);

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
        if (name === "@khanacademy/vite-helpers") {
            const src = fs.readFileSync(filename).toString();
            res.type('js');
            res.send(compile(src));
        } else {
            // TODO(kevinb): update cached module if code changes
            cjs2es(name).then(code => {
                res.type('js');
                res.send(code);
                modules[name] = code;
            });
        }
    }
}

// compile node modules on the fly to ES6 modules
app.get("/node_modules/:module", (req, res) => {
    const name = req.params.module;
    serveModule(res, name);
});

app.get("/node_modules/:scope/:module", (req, res) => {
    const name = req.params.module;
    const scope = req.params.scope;
    serveModule(res, `${scope}/${name}`);
});

app.get('/fixtures', (req, res) => {
    const fixtures = fs.readdirSync(config.fixtures);
    console.log(`fixtures: ${fixtures.join(', ')}`);

    res.type('json');
    res.send(fixtures);
});

app.post('/finish', (req, res) => {
    if (browser) {
        browser.kill('SIGHUP');
    }
    process.exit();
});

const compile = (src) => {
    // rewrite imports of node modules to be imports from /node_modules/<module_name>
    const code = src.replace(/from\s+\"([^\"\.\/][^\"]+)\"/g, 
        (match, group1, offset, string) => `from "/node_modules/${group1}"`);

    return transform(code, {transforms: ['jsx', 'flow']}).code;
}

const serveJsFile = (req, res, filename, srcTransform = (src) => src) => {
    if (!fs.existsSync(filename)) {
        console.log(`${filename} doesn't exist`);
        res.status(404);
        res.end();
    }

    // TODO(kevinb): cache compiled code and update cache when code changes
    console.log(`serving: ${req.path} using ${filename}`);
    const src = fs.readFileSync(filename).toString();
    res.type('js');
    res.send(compile(srcTransform(src)));
}

app.get('/fixtures/*.js', (req, res) => {
    const filename = path.join(
        config.fixtures, 
        path.relative('fixtures', req.path.slice(1)),
    );

    serveJsFile(req, res, filename, src => `\nimport * as React from "react";\n${src}`);
});

// compile all JS files with sucrase to get convert JSX to plain JS
app.get('*.js', (req, res) => {
    const filename = req.path.slice(1);
    const fullPath = filename === "index.js"
        ? path.join(__dirname, filename)
        : path.join(process.cwd(), filename);

    serveJsFile(req, res, fullPath);
});

const indexHandler = (req, res) => {
    const filename = req.path.slice(1);
    const fullPath = path.join(__dirname, "index.html");

    if (!fs.existsSync(fullPath)) {
        console.log(`${fullPath} doesn't exist`);
        res.status(404);
        res.end();
    }

    console.log(`serving: ${filename}`);
    const contents = fs.readFileSync(fullPath).toString();
    res.type('html');
    res.send(contents);
};

app.get('/index.html', indexHandler);
app.get('/', indexHandler);

app.listen(3000, () => console.log("listening on port 3000"));

// TODO: check process.platform and start appropriate browser
let browser;

if (process.platform === "linux") {
    // TODO: make the browser choice configurable
    // Linux supports Chromium and Firefox
    browser = child_process.exec(
        `chromium-browser --disable-gpu --no-sandbox --start-maximized http://localhost:3000/`,
        (err, stdout, stderr) => {
            // TODO: error handling
        });
} else if (process.platform === "darwin") {
    // TODO: make the browser choice configurable
    // MacOS supports Safari, Chrome, and Firefox
    child_process.exec(
        `open -Fna "Safari" http://localhost:3000`, 
        (err, stdout, stderr) => {
            // TODO: error handling
        });
}
