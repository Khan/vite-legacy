// TODO: move this into a separate package
import * as ReactDOM from "react-dom";

const domUpdateTimeout = 10;

export async function sleep(duration = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, duration);
    });
}

export async function simulate(event) {
    await fetch("http://localhost:3000/simulate", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            offsetX: window.screenX,
            offsetY: window.screenY + (window.outerHeight - window.innerHeight),
            event: event,
        }),
    });
    await sleep(domUpdateTimeout);
}

export async function log(message) {
    await fetch("http://localhost:3000/log", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({message}),
    });
}

let container;

export async function render(element) {
    return new Promise((resolve, reject) => {
        ReactDOM.render(element, container, () => {
            setTimeout(() => resolve(container), domUpdateTimeout);
        });
    });
}

let currentTest = null;

export async function runTests() {
    const start = Date.now();
    for (const test of tests) {
        const start = Date.now();
        currentTest = test;
        container = document.createElement("div");
        container.style.display = "inline-block";
        document.body.appendChild(container);
        await test.run();
        ReactDOM.unmountComponentAtNode(container);
        document.body.removeChild(container);
        await sleep();
        const elapsed = Date.now() - start;
        await log(`test duration: ${elapsed}ms`);
    }
    const elapsed = Date.now() - start;
    await log(`total duration: ${elapsed}ms`);
    await fetch("http://localhost:3000/finish", {
        method: "POST",
    });
}

const cssSelectorTimeout = 500;

export async function waitForSelectorToAppear(selector) {
    const start = Date.now();
    while (Date.now() - start < cssSelectorTimeout) {
        await sleep();
        if (document.querySelector(selector)) {
            return;
        }
    }
    throw new Error(
        `timeout threshold exceeding waiting for ${selector} to appear`,
    );
}

export async function waitForSelectorToDisappear(selector) {
    const start = Date.now();
    while (Date.now() - start < cssSelectorTimeout) {
        await sleep();
        if (!document.querySelector(selector)) {
            return;
        }
    }
    throw new Error(
        `timeout threshold exceeding waiting for ${selector} to disappear`,
    );
}

export async function waitForLocationHash(hash) {
    const start = Date.now();
    while (Date.now() - start < cssSelectorTimeout) {
        await sleep();
        if (window.location.hash === hash) {
            return;
        }
    }
    throw new Error(
        `timeout threshold exceeding waiting location.hash to change to ${hash}`,
    );
}

const counters = {};

export function expect(domElement) {
    return {
        toMatchScreenshot: async (options = {}) => {
            const bounds = domElement.getBoundingClientRect();
            const titlebarHeight = window.outerHeight - window.innerHeight;

            const outset = options.outset || 0;
            const title = currentTest.title
                .replace(/, /g, "_")
                .replace(" ", "_");

            if (!counters.hasOwnProperty(title)) {
                counters[title] = 0;
            }

            await fetch("/screenshot", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    filename: `${title}.${counters[title]++}.png`,
                    bounds: {
                        x: window.screenX + bounds.left - outset,
                        y:
                            window.screenY +
                            titlebarHeight +
                            bounds.top -
                            outset,
                        width: bounds.width + 2 * outset,
                        height: bounds.height + 2 * outset,
                    },
                }),
            });
        },
    };
}

const tests = [];
const titles = [];

export function test(title, callback) {
    tests.push({
        title: [...titles, title].join(", "),
        run: callback,
    });
}

export function describe(title, callback) {
    titles.push(title);
    callback();
    titles.pop();
}
