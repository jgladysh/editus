var gulp = require('gulp');

gulp.task('build', ['clean', 'lint'], function() {
    gulp.start('bundle');

});

gulp.task('bundle', ['scripts'], function() {
    global.doBeep = true;

});