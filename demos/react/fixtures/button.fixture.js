import * as ReactDOM from "react-dom";
import Button from "@khanacademy/wonder-blocks-button";

async function sleep(duration = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, duration);
    });
}

async function simulate(event) {
    await fetch("http://localhost:3000/simulate", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            offsetX: window.screenX,
            offsetY: window.screenY + (window.outerHeight - window.innerHeight),
            event: event,
        }),
    });
}

let container;

async function render(element) {
    return new Promise((resolve, reject) => {
        ReactDOM.render(element, container, () => {
            setTimeout(() => resolve(container), 0);
        });
    });
}

async function runTests(tests) {
    for (const test of tests) {
        container = document.createElement("div");
        container.style.display = "inline-block";
        document.body.appendChild(container);
        await test.run();
        ReactDOM.unmountComponentAtNode(container);
        document.body.removeChild(container);
        await sleep();
    }
}

let index = 0;
function expect(domElement) {
    return {
        toMatchScreenshot: async (options = {}) => {
            const bounds = domElement.getBoundingClientRect();
            const titlebarHeight = window.outerHeight - window.innerHeight;

            const outset = options.outset || 0;

            await fetch("/screenshot", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: `button.${index++}.png`,
                    bounds: {
                        x: window.screenX + bounds.left - outset,
                        y: window.screenY + titlebarHeight + bounds.top - outset,
                        width: bounds.width + 2 * outset,
                        height: bounds.height + 2 * outset,
                    },
                }),
            })
        },
    };
}

const tests = [];
const titles = [];

function test(title, callback) {
    tests.push({
        title: [...titles, title].join(", "),
        run: callback,
    });
}

function describe(title, callback) {
    titles.push(title);
    callback();
    titles.pop();

    runTests(tests).then(() => console.log('done'));
}

describe("Button", () => {
    test("primary", async () => {
        const element = await render(<Button>Hello, world!</Button>);
        await expect(element).toMatchScreenshot();
        await simulate({type: "mousemove", clientX: 50, clientY: 25});
        await expect(element).toMatchScreenshot({outset: 4});
        await simulate({type: "mousedown"});
        await expect(element).toMatchScreenshot();
    });

    test("secondary", async () => {
        const element = await render(<Button kind="secondary">Hello, world!</Button>);
        await expect(element).toMatchScreenshot();
    });

    test("tertiary", async () => {
        const element = await render(<Button kind="tertiary">Hello, world!</Button>);
        await expect(element).toMatchScreenshot();
    });
});
