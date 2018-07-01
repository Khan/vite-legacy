window.addEventListener("load", () => {

    window.addEventListener("message", (event) => {
        if (event.source === window && event.data && event.data.direction == "from-page") {
            console.log(event.data.message);
    
            if (event.data.message === "take-screenshot") {
                console.log("send message to background.js");
                chrome.runtime.sendMessage(event.data);
            }
        }
    });
    

    window.postMessage({
        direction: "from-content",
        message: "start-test",
    }, "*");
}, false);
