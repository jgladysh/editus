var pkg     = require('../package.json'),
    bundler = require('./helpers/bundler');

var _src    = './src/',
    _dist   = './dist',
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

    clean: {
        _dist: _dist
    }

};