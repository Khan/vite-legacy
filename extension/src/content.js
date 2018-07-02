const frametalk = require("frametalk");

window.addEventListener("load", () => {
    frametalk.replyOn("take-screenshot", (event, data) => {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(data, (res) => {
                resolve();
            });
        });
    });

    frametalk.send(window, "start-test");
}, false);
