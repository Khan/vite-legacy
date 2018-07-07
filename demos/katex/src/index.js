import frametalk from "frametalk";
import katex from "katex";

import testData from "./test-data";

const container = document.querySelector("#container");

function startTest() {
    const startTime = Date.now();
    const tests = Object.keys(testData)
        .filter(key => typeof testData[key] === "string")
        .map(key => {
            return {
                filename: `${key}.png`,
                tex: testData[key],
            };
        });
    
    // TODO(kevinb): use https://github.com/typekit/webfontloader
    // to force fonts to be loaded before running tests
    tests.unshift({
        filename: "throwaway.png",
        tex: "\\frac{x}{y}",
    });

    // TODO(kevinb): split this up into render and screenshotting functionality
    // this will allow us to eventually inject logic to simulate events and then
    // take additional screenshots whenever the DOM changes.
    function renderTex(tex, filename) {
        return new Promise((resolve, reject) => {
            try {
                katex.render(tex, container);
                setTimeout(() => {
                    const bounds = {
                        left: 0,
                        top: 0,
                        width: window.innerWidth,
                        height: window.innerHeight,
                    };

                    const titlebarHeight = window.outerHeight - window.innerHeight;
                
                    fetch("http://localhost:3000/screenshot2", {
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
                    }).then(() => {
                        container.innerHTML = "";
                        resolve();
                    });
                }, 25); // wait a little bit for the browser to finish painting
            } catch (e) {
                console.warn(`error rendering: ${tex}`);
                // TODO(kevinb): communicate failures back to the test runner
                resolve();
            }
        });
    }

    async function runTests() {
        for (const test of tests) {
            await renderTex(test.tex, test.filename);
        }
    }

    runTests().then(() => {
        console.log("finished running tests");
        const elapsedTime = Date.now() - startTime;
        console.log(`elpased time = ${elapsedTime}`);
    });
}

frametalk.on("start-test", (event, data) => {
    setTimeout(() => {
        startTest();
    }, 100);
});
