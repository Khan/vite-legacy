import * as ReactDOM from "react-dom";

async function runTests() {
    const res = await fetch("/fixtures");
    const fixtures = await res.json();
    for (const fixture of fixtures) {
        await import(`/fixtures/${fixture}`);
    }
}

runTests().then(() => console.log("finished"));
