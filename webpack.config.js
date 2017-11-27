const path = require('path');
const UglifyPlugin = require('uglifyjs-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');
const { BannerPlugin } = require('webpack');
const dateFormat = require('dateformat');

const config = {
    devtool: 'source-map',

    entry: {
    // FFZ v4
        demeter: './src/v4/index.js',
        'demeter-kyrios': './src/v4/core/index.js',
        'demeter-kalytera': './src/v4/betterttv/index.js',

        // 'demeter-paichnidi': './src/v4/gamewisp/index.js',
        // 'demeter-syzygos': './src/v4/maiwaifu/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        jsonpFunction: 'ffzapWebpackJsonp',
    },

    plugins: [
        new CleanPlugin(['dist']),
        new UglifyPlugin({
            sourceMap: true,
            uglifyOptions: {
                compress: {
                    keep_fnames: true,
                },
                mangle: {
                    keep_classnames: true,
                    keep_fnames: true,
                },
            },
        }),
        new BannerPlugin({
            banner: `Demeter - Built at ${dateFormat(new Date(), 'dd/mm/yyyy HH:MM:ss')}`,
        }),
    ],
};

module.exports = config;
