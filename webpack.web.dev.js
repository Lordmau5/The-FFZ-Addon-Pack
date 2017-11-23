/* eslint-disable */
const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.config.js');

const CopyPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
    devtool: 'inline-source-map',

	plugins: [
		new CopyPlugin([
			{
				from: './src/entry.js',
				to: 'ffz-ap.min.js'
			}
		])
	],

	devServer: {
		https: true,
		port: 3000,
		compress: true,
		inline: false,

		allowedHosts: [
			'.twitch.tv'
		],

		contentBase: path.join(__dirname, 'dist'),
		publicPath: '/script/',

		before(app) {
			app.get('/*', (req, res, next) => {
				res.setHeader('Access-Control-Allow-Origin', '*');
				next();
			});
		}
	},

	output: {
		publicPath: '/dist/',
		filename: '[name].js',
		jsonpFunction: 'ffzapWebpackJsonp'
	}
})