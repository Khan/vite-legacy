const path = require('path');

module.exports = [
    {
        entry: './recorder/src/index.js',
        output: {
            path: path.resolve(__dirname, 'recorder/dist'),
            filename: 'bundle.js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                    }
                }
            ]
        },
        mode: "development"
    },
    {
        entry: './demos/react/src/index.js',
        output: {
            path: path.resolve(__dirname, 'demos/react/dist'),
            filename: 'bundle.js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                    }
                }
            ]
        },
        mode: "development"
    },
    {
        entry: './demos/katex/src/index.js',
        output: {
            path: path.resolve(__dirname, 'demos/katex/dist'),
            filename: 'bundle.js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                    }
                }
            ]
        },
        mode: "development"
    },
];
