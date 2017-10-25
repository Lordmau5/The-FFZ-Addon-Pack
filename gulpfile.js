// Require Gulp and package.json
let gulp = require('gulp');
let pkg = require('./package.json');

// Require plugins
let concat = require('gulp-concat');
let wrapper = require('gulp-wrapper');
let rename = require('gulp-rename');
let uglify = require('gulp-uglify-es').default;
let connect = require('gulp-connect');
let gutil = require('gulp-util');
let dateformat = require('dateformat');

let devOnError = (err) => {
  gutil.log(gutil.colors.red('ERROR', 'watch'), err);
  this.emit('end', new gutil.PluginError('watch', err, { showStack: true }));
};

gulp.task('concat', () => {
  return gulp.src(['./src/main.js', './src/addons/_addon.js', './src/**/*.js'])
    .pipe(concat('ffz-ap.js'))
    .pipe(wrapper({
      header: '/*! ' + pkg.fullName + ' - Built at: ' + dateformat(new Date(), 'mm/dd/yyyy HH:MM:ss') + ' */\n(function(){\n',
      footer: '\n})();'
    }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('uglify', ['concat'], () => {
  return gulp.src('./dist/ffz-ap.js')
    .pipe(uglify({
      toplevel: true,
      ie8: false,
      mangle: {
        safari10: true
      }
    }))
    .pipe(rename('ffz-ap.min.js'))
    .pipe(wrapper({
      header: '/*! ' + pkg.fullName + ' - Built at: ' + dateformat(new Date(), 'mm/dd/yyyy HH:MM:ss') + ' */\n'
    }))
    .pipe(gulp.dest('./dist/'));
});

let cors = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
};

gulp.task('server', () => {
  return connect.server({
    root: 'dist',
    port: 3000,
    https: true,
    middleware: () => {
      return [cors];
    }
  });
});

gulp.task('watch', () => {
  return gulp.watch(['./src/main.js', './src/**/*.js'], ['build']);
});

gulp.task('build', ['uglify']);
gulp.task('dev', ['build', 'server', 'watch']);
