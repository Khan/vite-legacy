import * as ReactDOM from "react-dom";

async function sleep(duration = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, duration);
    });
}

async function renderReactElement(reactElement, container) {
    return new Promise((resolve, reject) => {
        ReactDOM.render(reactElement, container, resolve);
    });
}

async function screenshot(domElement, filename) {
    const bounds = domElement.getBoundingClientRect();
    const titlebarHeight = window.outerHeight - window.innerHeight;

    await fetch("/screenshot", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename: filename,
            bounds: {
                x: window.screenX + bounds.left,
                y: window.screenY + titlebarHeight + bounds.top,
                width: bounds.width,
                height: bounds.height,
            },
        }),
    })
}

async function renderFixture(name) {
    const fixture = await import(`/fixtures/${name}`);

    const container = document.createElement("div");
    container.style.display = "inline-block";
    document.body.appendChild(container);

    await renderReactElement(fixture.default, container);
    await sleep();
    await screenshot(container, `${name}.png`);
    
    ReactDOM.unmountComponentAtNode(container);
}

async function runTests() {
    const res = await fetch("/fixtures");
    const fixtures = await res.json();
    for (const fixture of fixtures) {
        await renderFixture(fixture);
    }
}

runTests().then(() => console.log("finished"));
