import * as ReactDOM from "react-dom";
import Button from "@khanacademy/wonder-blocks-button";

async function sleep(duration = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, duration);
    });
}

async function render(element) {
    return new Promise((resolve, reject) => {
        const container = document.createElement("div");
        container.style.display = "inline-block";
        document.body.appendChild(container);
        ReactDOM.render(element, container, () => {
            setTimeout(() => resolve(container), 0);
        });
    });
}

async function runTests(tests) {
    for (const test of tests) {
        await test.run();
    }
}

let index = 0;
function expect(domElement) {
    return {
        toMatchScreenshot: async () => {
            const bounds = domElement.getBoundingClientRect();
            const titlebarHeight = window.outerHeight - window.innerHeight;

            await fetch("/screenshot", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: `button.${index++}.png`,
                    bounds: {
                        x: window.screenX + bounds.left,
                        y: window.screenY + titlebarHeight + bounds.top,
                        width: bounds.width,
                        height: bounds.height,
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
