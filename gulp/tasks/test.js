var gulp = require('gulp');
var Server = require('karma').Server;

/**
 * Run test once and exit
 */
gulp.task('test', function (done) {
    new Server({
        configFile: '/Users/julia/projects/SQL-editor/karma.config.js',
        singleRun: true
    }, done).start();
});