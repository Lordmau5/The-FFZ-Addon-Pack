// Require Gulp and package.json
var gulp = require('gulp'),
    pkg = require('./package.json');

// Require plugins
var jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    wrapper = require('gulp-wrapper'),
    es6transpile = require('gulp-es6-transpiler'),
    uglify = require('gulp-uglifyjs'),
    connect = require('gulp-connect'),
    gutil = require('gulp-util'),
    dateformat = require('dateformat');

var dev_onError = function(err) {
  gutil.log(gutil.colors.red('ERROR', 'watch'), err);
  this.emit('end', new gutil.PluginError('watch', err, { showStack: true }));
};

gulp.task('jshint', function() {
  return gulp.src(['./src/main.js', './src/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('fail'));
});

gulp.task('concat', ['jshint'], function() {
  return gulp.src(['./src/main.js', './src/addons/_addon.js', './src/**/*.js'])
    .pipe(concat('ffz-ap.js'))
    .pipe(wrapper({
      header: '/*! ' + pkg.fullName + ' - Built at: ' + dateformat(new Date(), 'mm/dd/yyyy HH:MM:ss') + ' */\n(function(){\n',
      footer: '\n})();'
    }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('uglify', ['jshint', 'concat'], function() {
  return gulp.src('./dist/ffz-ap.js')
    .pipe(es6transpile({
      'globals': {
        'FrankerFaceZ': false,
        '$': false,
        'msgpack': false,
        'fetch': false,
        'Headers': false
      },
    }).on('error', dev_onError))
    .pipe(uglify('ffz-ap.min.js', {
      compress: true,
      mangle: {
        toplevel: true,
        screw_ie8: true
      }
    }).on('error', dev_onError))
    .pipe(wrapper({
      header: '/*! ' + pkg.fullName + ' - Built at: ' + dateformat(new Date(), 'mm/dd/yyyy HH:MM:ss') + ' */\n'
    }))
    .pipe(gulp.dest('./dist/'));
});

var cors = function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
};

gulp.task('server', function() {
  return connect.server({
      root: 'dist',
      port: 3000,
      https: true,
      middleware: function() {
        return [cors];
      }
    });
});

gulp.task('watch', function() {
  return gulp.watch(['./src/main.js', './src/**/*.js'], ['build']);
});

gulp.task('build', ['uglify']);
gulp.task('dev', ['build', 'server', 'watch']);
