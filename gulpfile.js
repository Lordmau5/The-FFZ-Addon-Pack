// Require Gulp and package.json
var gulp = require('gulp');
var pkg = require('./package.json');

// Require plugins
var concat = require('gulp-concat');
var wrapper = require('gulp-wrapper');
var babel = require('gulp-babel');
var uglify = require('gulp-uglifyjs');
var connect = require('gulp-connect');
var gutil = require('gulp-util');
var dateformat = require('dateformat');

var devOnError = function (err) {
  gutil.log(gutil.colors.red('ERROR', 'watch'), err);
  this.emit('end', new gutil.PluginError('watch', err, { showStack: true }));
};

gulp.task('concat', function () {
  return gulp.src(['./src/main.js', './src/addons/_addon.js', './src/**/*.js'])
    .pipe(concat('ffz-ap.js'))
    .pipe(wrapper({
      header: '/*! ' + pkg.fullName + ' - Built at: ' + dateformat(new Date(), 'mm/dd/yyyy HH:MM:ss') + ' */\n(function(){\n',
      footer: '\n})();'
    }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('uglify', ['concat'], function () {
  return gulp.src('./dist/ffz-ap.js')
    // .pipe(es6transpile({
    .pipe(babel({
      presets: ['es2015']
    }).on('error', devOnError))
    .pipe(uglify('ffz-ap.min.js', {
      compress: true,
      mangle: {
        toplevel: true,
        screw_ie8: true
      }
    }).on('error', devOnError))
    .pipe(wrapper({
      header: '/*! ' + pkg.fullName + ' - Built at: ' + dateformat(new Date(), 'mm/dd/yyyy HH:MM:ss') + ' */\n'
    }))
    .pipe(gulp.dest('./dist/'));
});

var cors = function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
};

gulp.task('server', function () {
  return connect.server({
    root: 'dist',
    port: 3000,
    https: true,
    middleware: function () {
      return [cors];
    }
  });
});

gulp.task('watch', function () {
  return gulp.watch(['./src/main.js', './src/**/*.js'], ['build']);
});

gulp.task('build', ['uglify']);
gulp.task('dev', ['build', 'server', 'watch']);
