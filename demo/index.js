import * as React from "react";
import * as ReactDOM from "react-dom";

import Foo from "./components/foo";
import Bar from "./components/bar";

const container = document.querySelector("#container");

window.addEventListener("message", (event) => {
    if (event.source === window && event.data && event.data.direction == "from-content") {
        if (event.data.message === "start-test") {
            const startTime = Date.now();
            const tests = [
                {
                    filename: "foo.png",
                    element: <Foo/>,
                },
                {
                    filename: "bar.png",
                    element: <Bar/>,
                },
                {
                    filename: "foobar.png",
                    element: <div>
                        <Foo/>
                        <Bar/>
                    </div>,
                },
                {
                    filename: "barfoo.png",
                    element: <div>
                        <Bar/>
                        <Foo/>
                    </div>,
                },
            ];

            // TODO(kevinb): allow for different functions for individual tests so that
            // we can use this for KaTeX as well

            // TODO(kevinb): split this up into render and screenshotting functionality
            // this will allow us to eventually inject logic to simulate events and then
            // take additional screenshots whenever the DOM changes.
            function renderElement(element, filename) {
                return new Promise((resolve, reject) => {
                    try {
                        ReactDOM.render(element, container, () => {
                            // wait for styles to be applied
                            setTimeout(() => {
                                const bounds = container.getBoundingClientRect();
                                window.postMessage({
                                    direction: "from-page",
                                    message: "take-screenshot",
                                    filename: filename,
                                    bounds: bounds,
                                }, "*");
    
                                // wait for screenshot to be taken
                                // TODO(kevinb): post a message back after it's been taken
                                setTimeout(() => {
                                    ReactDOM.unmountComponentAtNode(container);
                                    resolve();
                                }, 100);
                            }, 0);
                        });
                    } catch (e) {
                        // TODO(kevinb): communicate failures back to the test runner
                        ReactDOM.unmountComponentAtNode(container);
                        resolve();
                    }
                });
            }

            async function runTests() {
                for (const test of tests) {
                    await renderElement(test.element, test.filename);
                }
            }

            runTests().then(() => {
                console.log("finished running tests");
                const elapsedTime = Date.now() - startTime;
                console.log(`elpased time = ${elapsedTime}`);
            });
        }
    }
});
