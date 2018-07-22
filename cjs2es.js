const rollup = require('rollup');
const path = require('path');
const fs = require('fs');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const replace = require('rollup-plugin-replace');
const assert = require('assert');
const resolve = require('resolve');

console.log(`basedir = ${process.cwd()}`);

async function build(moduleName) {
    const entry = resolve.sync(moduleName, {basedir: process.cwd()});
    const mod = require(entry);

    const inputOptions = {
        input: entry,
        plugins: [
            nodeResolve({
                jsnext: true,
                main: true,
                browser: true,
            }),
            commonjs({
                namedExports: {
                    [entry]: moduleName.startsWith("react") ? Object.keys(mod) : [],
                },
            }),
            replace({
                'process.env.NODE_ENV': JSON.stringify('production')
            }),
        ],
    };

    const outputOptions = {
        format: 'es',
    };

    // create a bundle
    const bundle = await rollup.rollup(inputOptions);

    // generate code and a sourcemap
    const {code, map} = await bundle.generate(outputOptions);

    return code;
}

module.exports = build;
