var del = require('del');
var gulp = require('gulp');
var coffee = require("gulp-coffee");
var watch = require("gulp-watch");

var bases = {
  src: './src/**/*.coffee',
  dist: './lib/'
};
var coffeeOptions = {
  bare: true
}

gulp.task('clean', function() {
  return del([bases.dist + '**/*']);
});

gulp.task('compile-coffee', ['clean'], function() {
  gulp.src(bases.src)
    .pipe(coffee(coffeeOptions))
    .pipe(gulp.dest(bases.dist));
});

gulp.task('watch-coffee', function () {
  gulp.watch(bases.src, ['compile-coffee']);
});

gulp.task('default', function() {
  gulp.start('compile-coffee');
});