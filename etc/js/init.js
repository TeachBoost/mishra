/**
 * init.js
 * Set up directories and the environment
 *
 * To run:
 * $> node etc/js/copy_assets.js
 */
'use strict';

var fs = require( 'fs' )
  , mkdirp = require( 'mkdirp' )
  , async = require( 'async' )
  , colors = require( 'colors' );
var scriptPath = __dirname + '/';
var defaults = JSON.parse(
    fs.readFileSync(
        scriptPath + '../defaults.json', 'utf8'
    ));
var appPath = scriptPath + defaults.devPaths.appPath
  , buildPath = scriptPath + defaults.devPaths.buildPath
  , configPath = scriptPath + '../config.json';

// directories to create
var dirs = [
    appPath + 'base/images',
    appPath + 'base/lib',
    appPath + 'base/styles',
    appPath + 'base/views',
    appPath + 'modules',
    buildPath + 'css',
    buildPath + 'fonts',
    buildPath + 'img',
    buildPath + 'js'
];

// Check if config file exists
if ( ! fs.existsSync( configPath ) ) {
    console.log( ('PATH:  ' + configPath).blackBG.red.bold );
    console.log( ('ERROR: Config file not found. Please run node configure.js <environment>').blackBG.red.bold );
}
else {
    console.log( 'Creating files and directories' );
    // Make all the directories listed in dirs.
    // Uses async so that creating the index.less file doesn't happen
    // until all the parent directories are created.
    async.map( dirs, mkdirp, function ( err, results ) {
        // Create style.less file
        if ( ! fs.existsSync( appPath + 'base/styles/index.less' ) ) {
            console.log( 'Creating base index.less file' );
            fs.open( appPath + 'base/styles/index.less', 'w' );
        }
        if ( err ) {
            console.log( ('ERROR: ' + err).blackBG.red.bold );
            return false;
        }
        console.log( 'Success!'.green.bold );
    });
}