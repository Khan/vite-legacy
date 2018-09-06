import {runTests} from "@khanacademy/vite-helpers";

async function queueTests() {
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
