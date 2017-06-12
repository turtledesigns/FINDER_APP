'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp'),
	gutil = require('gulp-util'),
	$ = require('gulp-load-plugins')(),
	del = require('del'),
	runSequence = require('run-sequence'),
	useref = require('gulp-useref'),
	replace = require('gulp-replace'),
	rename = require('gulp-rename'),
	jeditor = require("gulp-json-editor"),
	ftp = require("gulp-ftp"),
	argv = require('yargs').argv,
	fs = require('fs'),
	pkg = require('./package.json'),
	version = pkg.version,

	builds = {
		"supermarket": {
			id: "com.turtledesigns.supermarkets",
			key: "supermarket",
			title: "Supermarket Finder",
			description: "Find your nearest supermarket based on your current GPS location."
		},
		"vegan": {
			id: "com.turtledesigns.vegana",
			key: "vegan",
			title: "Where Vegan-a Go?",
			description: "Find your nearest vegan restaurant based on your current GPS location."
		},
		"petrol": {
			id: "com.turtledesigns.fuel",
			key: "petrol",
			title: "Fuel Finder",
			description: "Find your nearest gas station based on your current GPS location."
		},
		"atm": {
			id: "com.turtledesigns.atm",
			key: "atm",
			title: "ATM Finder",
			description: "Find your nearest ATM machine based on your current GPS location."
		},
		"curry": {
			id: "com.turtledesigns.curry",
			key: "curry",
			title: "Local Curry Finder",
			description: "Find your nearest curry restaurant based on your current GPS location."
		},
		"vegetarian": {
			id: "com.turtledesigns.wheregetarian",
			key: "vegetarian",
			title: "Where-getarian?",
			description: "Find your nearest vegetarian restaurant based on your current GPS location."
		},
		"fastfood": {
			id: "com.turtledesigns.fastfood",
			key: "fastfood",
			title: "Find Food Faster. The Fast Food Finder",
			description: "Find your nearest fast food joint based on your current GPS location."
		}
	};

/**
 * processes the source files for use in the win 10 app
 */
gulp.task('amendSource', function(){
    
    gulp.src(['working_folder/temp_modules/' + builds[argv.appname].key + '/**/*', 'working_folder/temp_modules/default/**/*'], { base: 'working_folder/temp_modules/' })
    .pipe(gulp.dest('app/www/modules'));
    
	gulp.src('app/www/settings.json', {base:''})
	.pipe(replace(/("module":")(.*)(",)/ig, "$1" + builds[argv.appname].key + '$3'))
	.pipe(gulp.dest('app/www'));
    
	gulp.src('app/config.xml', {base:''})
	.pipe(replace(/(<name>)(.*)(<\/name>)/ig, '$1' + builds[argv.appname].title + '$3'))
	.pipe(replace(/(<description>)(.*)(<\/description>)/ig, "$1" + builds[argv.appname].description + '$3'))
	.pipe(replace(/(widget id=\")(.*?)(\")/ig, "$1" + builds[argv.appname].id + '$3'))
	.pipe(replace(/(version=\")(.*?)(\" xmlns)/ig, "$1" + pkg.version + '$3'))
	.pipe(replace(/(<icon src="www\/modules\/)(.*?)(\/icon\.png" \/>)/ig, "$1" + builds[argv.appname].key + '$3'))
	.pipe(gulp.dest('app'));
    
	return gulp.src('app/www/modules/' + builds[argv.appname].key + '/icon.png')
	.pipe(gulp.dest('app/platforms/android/res/mipmap-hdpi'))
	.pipe(gulp.dest('app/platforms/android/res/mipmap-ldpi'))
	.pipe(gulp.dest('app/platforms/android/res/mipmap-mdpi'))
	.pipe(gulp.dest('app/platforms/android/res/mipmap-xhdpi'))
	.pipe(gulp.dest('app/res/mipmap-mdpi'))
	.pipe($.size({title: 'amendSource'}));
    
  });

/**
 * processes the source files for use in the win 10 app
 */
gulp.task('copyAllFilesToTemp', function(){
    gulp.src('app/www/modules/**/*')
    .pipe(gulp.dest('working_folder/temp_modules'));
});

/**
 * processes the source files for use in the win 10 app
 */
gulp.task('deleteModuleFiles', function(){
    del('app/www/modules/**/*',{force:true});
});

/**
 * processes the source files for use in the win 10 app
 */
gulp.task('copyAllFilesBackToModuleFolder', function(){
    gulp.src('working_folder/temp_modules/**/*')
    .pipe(gulp.dest('app/www/modules'));
});

/**
 * processes the source files for use in the win 10 app
 */
gulp.task('deleteAllFilesFromTemp', function(){
    del('working_folder/temp_modules/**/*',{force:true});
});

gulp.task('ftp', function () {
	return gulp.src('release/BUILD_' + pkg.version + '/*')
	.pipe(ftp({
		host: 'XXXXXX',
		user: 'XXXXXX',
		pass: 'XXXXXX',
		remotePath: 'finder/'
	}))
	.pipe(gutil.noop());
});

/**
 * increments version number in package.json
 */
gulp.task('version',function(){
	version = pkg.version.substr(0,pkg.version.lastIndexOf('.')+1) + String(Number(pkg.version.substr(pkg.version.lastIndexOf('.')+1,pkg.version.length))+1);
	return gulp.src('./package.json')
	.pipe(jeditor({
		'version': version
	},
				  // the second argument is passed to js-beautify as its option
				  {
		'indent_char': '\t',
		'indent_size': 1
	}))
	.pipe(gulp.dest("./"));
});

// copy assets
gulp.task('moveBuildToCorrectFolder', function (){
	return gulp.src('app/platforms/android/build/outputs/apk/android-release.apk')
		.pipe(rename(argv.appname + '.apk'))
		.pipe($.if((argv.testBuild == true), gulp.dest('release/TESTBUILD_' + pkg.version)))
		.pipe($.if((!argv.testBuild), gulp.dest('release/BUILD_' + pkg.version)))
});

// Build Production Files, the Default Task
gulp.task('default', function (cb) {
	$.cache.clearAll();
});

// Load custom tasks from the `tasks` directory
try { require('require-dir')('tasks'); } catch (err) {}
