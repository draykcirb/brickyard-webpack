/* eslint global-require:0 */
const path = require('path')
const webpack = require('webpack')
const autoPrefixer = require('autoprefixer')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')

function generate(config) {
    const commonConfig = {
        context: path.resolve(process.cwd(), config.pluginStore),
        output: {
            path: path.join(config.outputBase, config.destPostfix)
        },
        module: {
            loaders: [
                // **********************************
                // special for jquery
                // **********************************
                {
                    test: /jquery$/,
                    loader: 'expose?$!expose?jQuery'
                },

                // babel transpile js
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    loader: `babel?cacheDirectory=${path.resolve('.babel-cache/')}`
                }
            ]
        },
        plugins: [
            new webpack.optimize.DedupePlugin(),
            new webpack.ProvidePlugin({
                jQuery: 'jquery',
                $: 'jquery',
                'window.jQuery': 'jquery'
            }),
            new webpack.ResolverPlugin(
              new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('.bower.json', ['main'])
            ),
            new ProgressBarPlugin()
        ],
        resolve: {
            extensions: ['', '.webpack.js', '.web.js', '.js'],
            root: [path.resolve(process.cwd(), 'node_modules'), path.join(config.outputBase, 'bower_components')]
        },
        postcss() {
            return [
                autoPrefixer({
                    browsers: [
                        'last 2 versions',
                        '> 1%',
                        'not ie <= 8'
                    ],
                    add: true
                }),
                require('postcss-normalize-charset')
            ]
        }
    }

    if (config.lint) {
        commonConfig.module.preLoaders = [
            // style lint
            {
                test: /\.(scss|css)$/,
                loader: 'stylelint'
            },
            // eslint
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'eslint-loader'
            }
        ]
        commonConfig.eslint = {
            emitError: true,
            emitWarning: false,
            quiet: false,
            failOnWarning: false,
            failOnError: true
        }
    }

    return commonConfig
}

module.exports = generate
