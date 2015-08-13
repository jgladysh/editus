var pkg     = require('../package.json'),
    bundler = require('./helpers/bundler');

var _src    = './src/',
    _dist   = './dist',
    _css    = 'css/',
    _js     = 'js/';

var bundles = [
    {
        name        : 'editus',
        global      : 'editus',
        compress    : true,
        saveToDist  : true
    }
];

module.exports = {
    scripts: {
        bundles: bundler(bundles, _js, _src, _dist),
        banner: '/** ' + pkg.name + ' v' + pkg.version + ' **/\n',
        lint: {
            options: pkg.lintOptions,
            dir: _src + _js
        }
    },
    css: {
        bundles: bundler(bundles, _css, _src, _dist),
        autoprefixer: {
            browsers: ['> 1%', 'last 2 versions'],
            cascade: false
        },
        compress: {}
    },

    clean: {
        _dist: _dist
    }

};