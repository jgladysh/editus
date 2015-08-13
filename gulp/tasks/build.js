var gulp = require('gulp');

gulp.task('build', ['clean', 'lint'], function() {
    gulp.start('bundle');

});

gulp.task('bundle', ['scripts', 'css'], function() {
    global.doBeep = true;

});