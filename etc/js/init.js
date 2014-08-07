// init.js
// Set up directories and the environment

'use strict';

var fs = require( 'fs' )
  , mkdirp = require( 'mkdirp' )
  , async = require( 'async' );

var scriptPath = __dirname + '/';

var defaults = JSON.parse( fs
        .readFileSync( scriptPath + '/../defaults.json', 'utf8' ) );

var paths = defaults.paths
  , appPath = scriptPath + paths.appPath
  , buildPath = scriptPath + paths.buildPath
  , configPath = scriptPath + '/../config.json';


// should move these to config?
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
if ( !fs.existsSync( configPath ) ) {
    console.log( configPath );
    console.log( 'ERROR: Config file not found. Please run node configure.js <profile>' );
} else {
    // Make all the directories listed in dirs.
    // Uses async so that creating the index.less file doesn't happen
    // until all the parent directories are created.
    async.map( dirs, mkdirp, function ( err, results ) {
        // Create style.less file
        if ( !fs.existsSync( appPath + 'base/styles/index.less' ) ) {
            fs.open( appPath + 'base/styles/index.less', 'w' );
        }
        if ( err ) {
            console.log( 'ERROR: ' + err );
        }

    } );
}
