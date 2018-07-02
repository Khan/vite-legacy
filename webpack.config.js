const path = require('path');

module.exports = [
    {
        entry: './extension/src/content.js',
        output: {
            path: path.resolve(__dirname, 'extension/dist'),
            filename: 'content.js'
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
        entry: './demo/index.js',
        output: {
            path: path.resolve(__dirname, 'dist'),
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
