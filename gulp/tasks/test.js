var gulp = require('gulp');
var Server = require('karma').Server;
var isTravis = process.env.TRAVIS || false;

/**
 * Run test once and exit
 */
gulp.task('test', function (done) {
    new Server({
        configFile: __dirname + '/../../karma.config.js',
        singleRun: isTravis
    }, done).start();
});