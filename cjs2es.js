const rollup = require('rollup');
const path = require('path');
const fs = require('fs');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const replace = require('rollup-plugin-replace');
const assert = require('assert');

const getEntry = (moduleName) => {
    const pkgJsonPath = path.join('node_modules', moduleName, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) {
        return null;
    }
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath));
    const main = pkgJson.main;
    assert(main);
    return path.join('node_modules', moduleName, main);
};

async function build(moduleName) {
    const entry = getEntry(moduleName);
    const mod = require(moduleName);

    const inputOptions = {
        input: entry,
        plugins: [
            nodeResolve({
                jsnext: true,
                main: true,
                browser: true,
            }),
            commonjs({
                include: 'node_modules/**',
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
