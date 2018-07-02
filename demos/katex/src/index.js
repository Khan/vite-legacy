import frametalk from "frametalk";
import katex from "katex";

const container = document.querySelector("#container");

function startTest() {
    const startTime = Date.now();
    const tests = [
        // TODO(kevinb): use https://github.com/typekit/webfontloader
        // to force fonts to be loaded before running tests
        {
            filename: "throwaway.png",
            tex: "\\frac{x}{y}",
        },
        {
            filename: "frac.png",
            tex: "\\frac{x}{y}",
        },
        {
            filename: "quadratic_formula.png",
            tex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        },
    ];

    // TODO(kevinb): split this up into render and screenshotting functionality
    // this will allow us to eventually inject logic to simulate events and then
    // take additional screenshots whenever the DOM changes.
    function renderTex(tex, filename) {
        return new Promise((resolve, reject) => {
            try {
                katex.render(tex, container);
                setTimeout(() => {
                    const bounds = container.getBoundingClientRect();
                    frametalk.request(window, "take-screenshot", {
                        filename: filename,
                        bounds: bounds,
                    }).then(() => {
                        container.innerHTML = "";
                        resolve();
                    });
                }, 0);
            } catch (e) {
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
