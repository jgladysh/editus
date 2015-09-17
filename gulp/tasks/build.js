var gulp = require('gulp');

gulp.task('build', ['clean', 'lint', 'bower'], function() {
    gulp.start('bundle');

});

gulp.task('bundle', ['scripts', 'css', 'test'], function() {
    global.doBeep = true;

});