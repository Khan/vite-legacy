chrome.runtime.onInstalled.addListener(function() {
    chrome.runtime.onMessage.addListener(message => {
        console.log(message);
        chrome.windows.getCurrent({}, win => {
            chrome.tabs.captureVisibleTab(win.id, {format: "png"}, dataUrl => {
                console.log("taking screenshot");

                // TODO(kevinb): get hostname from content.js script
                fetch("http://localhost:3000/screenshot", {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        dataUrl: dataUrl,
                        filename: message.filename,
                        bounds: message.bounds,
                    }),
                }).then(() => {
                    console.log("message sent to /screenshot");
                });
            });
        });
    });
});