chrome.runtime.onInstalled.addListener(function() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log(message);

        chrome.tabs.captureVisibleTab(sender.tab.windowId, {format: "png"}, dataUrl => {
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
                // tell content.js that we've successfully taken the screenshot
                sendResponse();
                console.log("message sent to /screenshot");
            });
            // TODO(kevinb): send a response if the POST fails
        });

        // indicate that response will be asynchronous
        return true;
    });
});
