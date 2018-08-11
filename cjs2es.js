const rollup = require('rollup');
const path = require('path');
const fs = require('fs');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const assert = require('assert');
const autoExternal = require('rollup-plugin-auto-external');

console.log(`basedir = ${process.cwd()}`);

async function build(moduleName) {
    const pkg = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "node_modules", moduleName, "package.json"), "utf-8").toString());

    // use es6 modules if available
    const entry = pkg.module || pkg.main;
    const input = path.join(process.cwd(), "node_modules", moduleName, entry);

    const inputOptions = {
        input,
        plugins: [
            autoExternal(),
            resolve({
                module: true,
                jsnext: true,
                main: true,
                browser: true,
            }),
            commonjs(pkg.module ? {} : {
                namedExports: {
                    [input]: Object.keys(require(input)).filter(key => key !== "default"),
                },
            }),
        ],
    };

    const outputOptions = {
        format: 'es',
    };

    // create a bundle
    const bundle = await rollup.rollup(inputOptions);

    // generate code and a sourcemap
    let {code, map} = await bundle.generate(outputOptions);

    // TODO: use built-in plugin
    code = code
        .replace(/process\.env\.NODE_ENV/g, '"production"');

    // rename imports to have an absolute path
    // note: rollup generates 'import Foo from "foo"' statements instead of 
    // 'import * as Foo from "foo"'.
    return code.replace(/import\s+([a-zA-Z0-9$]+)\s+from\s+['"]([^'"]+)['"]/g, 
        (match, name, path) => `import * as ${name} from "/node_modules/${path}"`);
}

module.exports = build;
