/* eslint import/no-extraneous-dependencies:0 */
const expect = require('chai').expect
const merge = require('webpack-merge')

describe('merge test', function () {
    it('should merge with corect order', function () {
        const config1 = {
            module: {
                rules: [{
                    test: /\.html$/,
                    loader: 'html?attrs=link:href img:src use:xlink:href'
                }]
            }
        }

        const config2 = {
            module: {
                rules: [{
                    test: /\.html$/,
                    exclude: /index\.html/,
                    loaders: ['ngtemplate', 'html?attrs=link:href img:src source:src']
                }]
            }
        }

        expect(merge.smart(config1, config2)).to.eql({
            module: {
                rules: [{
                    test: /\.html$/,
                    loader: 'html?attrs=link:href img:src use:xlink:href'
                }, {
                    test: /\.html$/,
                    exclude: /index\.html/,
                    loaders: ['ngtemplate', 'html?attrs=link:href img:src source:src']
                }]
            }
        })
    })

    it('should merge with corect order', function () {
        const config1 = {
            module: {
                rules: [// babel transpile js
                    {
                        test: /\.js$/,
                        exclude: /(node_modules|bower_components)/,
                        loader: 'babel?cacheDirectory'
                    }
                ]
            }
        }

        const config2 = {
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        exclude: /(node_modules|bower_components)/,
                        loaders: ['ng-annotate-loader']
                    }
                ]
            }
        }

        const result = merge.smartStrategy({
            'module.rules.loaders': 'prepend'
        })(config1, config2)

        expect(result).to.eql({
            module: {
                rules: [{
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    loaders: ['ng-annotate-loader', 'babel?cacheDirectory']
                }]
            }
        })
    })
})
