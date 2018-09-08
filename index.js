import {runTests, log} from "@khanacademy/vite-helpers";

const params = new URLSearchParams(location.search);
const runner = params.get("runner");
const display = params.get("display");

async function queueTests() {
    await log(`runner = ${runner}`);
    await log(`display = ${display}`);
    await log(`search = ${location.search}`);

    const res = await fetch("/fixtures");
    const fixtures = await res.json();
    for (const fixture of fixtures) {
        await import(`/fixtures/${fixture}`);
    }
}

queueTests()
    .then(() => runTests())
    // eslint-disable-next-line no-console
    .then(() => console.log("finished"))
    // eslint-disable-next-line no-console
    .catch(() => console.error("failure in tests"));
