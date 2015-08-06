var gulp = require('gulp'),
    connect = require('gulp-connect');

gulp.task('connect', function(){
  connect.server({
    root: 'src',
    livereload: true
  });
});

gulp.task('reload', function(){
  gulp.src('./src/*.html')
    .pipe(connect.reload());
});

gulp.task('watch', function(){
  gulp.watch(['./src/**/*.js', './src/*.html'], ['reload']);
});

gulp.task('default', ['connect', 'watch']);
