/**
 * Created by Alex on 12/28/2015.
 */
'use strict';
var webpack = require('webpack'),
    path = require('path');

var APP = path.resolve(__dirname, 'src');

var PROD = false;

module.exports = {
    context: APP,
    entry: {
        fbdevice: './build.js'
    },
    plugins: PROD ? [
        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            exclude: [/angular.*\.js($|\?)/i],
            mangle: {
                except: ['angular', '$routeProvider', 'WebSocketServiceProvider', '$rootScope']
            }
        })
    ] : [],
    devtool: "source-map",
    output: {
        path: path.resolve(APP, '../dist'),
        filename: '[name].js',
        sourceMapFilename: '[file].map',
        publicPath: '../dist/'
    },
    module: {
        loaders: [
            {
                test: /\.json/,
                loader: 'json-loader'
            },
            {
                test: /\.css$/,
                loader: 'style!css'
            },
            {
                test: /.(png|jpg|woff(2)?|eot|ttf|svg)(\?[a-z0-9=\.]+)?$/,
                loader: 'url-loader?limit=100000'
            },
            {
                test: /\.(html|tmpl)$/,
                loader: 'html-loader'
            }
        ]
    }
};