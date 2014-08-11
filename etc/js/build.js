#!/usr/bin/env node
/**
 * build.js
 * Packages node modules, other vendor js, and custom js
 * using Browserify.
 *
 * To run:
 * $> node etc/js/build.js [--debug] [--minify] [module|all]
 */
'use strict';

// Required before all
var fs = require( 'fs' )
  , _ = require( 'underscore' )
  , async = require( 'async' )
  , mkdirp = require( 'mkdirp' )
  , colors = require( 'colors' )
  , childProcess = require( 'child_process' )
  , program = require( 'commander' )
  , browserify = require( 'browserify' );

// Get base paths, config files
var scriptPath = __dirname
  , config = JSON.parse(
        fs.readFileSync(
            scriptPath + '/../config.json',
            'utf8'
        ))
  , defaults = JSON.parse(
        fs.readFileSync(
            scriptPath + '/../defaults.json',
            'utf8'
        ))
  , settings = _.extend( defaults, config )
  , basePath = scriptPath + '/' + settings.devPaths.basePath
  , modulePath = scriptPath + '/' + settings.devPaths.modulePath
  , vendorPath = scriptPath + '/' + settings.devPaths.vendorPath
  , buildPath = scriptPath + '/' + settings.devPaths.buildPath
  , flags = {
        minify: false,
        debug: false }
  , modules = [ 'all' ];

// Set up commander
program
    .version( '1.0.0' )
    .usage( '[options] [modules|all]' )
    .option( '-d, --debug', 'Build browserify with debug option' )
    .option( '-m, --minify', 'Minify browserify bundles with uglifyify' )
    .parse( process.argv );

// Set up flags
function initFlags ( callback ) {
    if ( ! _.isUndefined( program.minify ) ) {
        flags.minify = program.minify;
    }
    if ( ! _.isUndefined( program.debug ) ) {
        flags.debug = program.debug;
    }
    callback( null, "Initialized flags" );
}

// Set up the modules to run
function initModules ( callback ) {
    if ( program.args.length ) {
        modules = program.args;
    }
    callback( null, "Initialized modules" );
}

// Build the specified modules with the flags
function build ( callback ) {
    // create public asset folders
    mkdirp( buildPath + '/js' );
    mkdirp( buildPath + '/css' );

    // check for 'all' or 'base' keywords
    if ( _.indexOf( modules, 'base' ) !== -1 ) {
        buildBase();
        modules = _.without( modules, 'base' );
    }
    else if ( _.indexOf( modules, 'all' ) !== -1 ) {
        buildBase();
        modules = [];
        _.each( settings.modules, function ( value, key ) {
            modules.push( key );
        });
    }

    // iterate through module lists and compile them
    _.each( modules, function ( module ) {
        buildModule( module );
    });

    callback( null, "Finished build" );
}

// Build the base module
function buildBase () {
    // build the bundle
    browserifyModules(
        'base',
        null,
        ( flags.minify )
            ? buildPath + 'js/base.min.js'
            : buildPath + 'js/base.js',
        settings.base.browserify );
    // and copy the assets
    async.series([
        copyBaseJsFiles,
        lessCssFiles,
        copyBaseCssFiles
    ], function ( err, results ) {
        if ( err ) {
            console.log( ('ERROR: ' + err).blackBG.red.bold );
        }
        else {
            console.log( results.join( '\n' ) );
        }
    });
}

// Copy any JS files
function copyBaseJsFiles ( callback ) {
    var jsPath = buildPath + 'js/';

    if ( config.base.js.value.length > 0 ) {
        config.base.js.value.forEach(
            function ( jsFile ) {
                fs.createReadStream( vendorPath + jsFile.source )
                    .pipe( fs.createWriteStream( jsPath + jsFile.target ) );
            });
    }

    callback(
        null,
        'Vendor JS files copied to ' + jsPath.replace( __dirname, '' ) );
}

// Copy and concatenate any CSS files into base.css
function copyBaseCssFiles ( callback ) {
    if ( config.base.css.value.length > 0 ) {
        var cssPath = buildPath + 'css/base.css';
        concat({
            src: config.base.css.value,
            dest: cssPath
        });
    }

    callback( null, 'Vendor CSS files concatenated into base.css' );
}

// Compile the LESS files and concatenate into base.css
function lessCssFiles ( callback, module ) {
    var inFile = ( module === undefined )
            ? basePath + '/styles/index.less'
            : modulePath + module + '/' + 'styles/index.less'
      , outFile = ( module === undefined )
            ? buildPath + 'css/base.css'
            : buildPath + 'css/' + module + '.css'
      , command = 'lessc ' + inFile + ' ' + outFile;

    // Run the command
    var lesscProcess = childProcess.exec(
        command,
        function ( error, stdout, stderr ) {
            if ( stdout ) {
                //console.log( 'stdout: ' + stdout );
            }
            if ( stderr ) {
                console.log( ('ERROR: (exec) ' + stderr).blackBG.red.bold );
            }
            if ( error !== null ) {
                console.log( ('ERROR: (exec) ' + error).blackBG.red.bold );
            }

            if ( module === undefined ) {
                callback( null, 'LESS CSS compiled into ' + outFile.replace( __dirname, '' ) );
            }
            else {
                console.log( 'LESS CSS compiled into ' + outFile.replace( __dirname, '' ) );
            }
        });
}

// Build a regular module
function buildModule ( module ) {
    // check that module path exists
    if ( fs.existsSync( modulePath + module + '/index.js' ) ) {
        // build the bundle
        browserifyModules(
            module,
            [ modulePath + module + '/index.js' ],
            ( flags.minify )
                ? buildPath + 'js/' + module + '.min.js'
                : buildPath + 'js/' + module + '.js',
            settings.modules[ module ].browserify );
        // less the CSS
        lessCssFiles( null, module );
    }
    else {
        console.log(
            ('Module does not seem to exist. Looked for ' + modulePath +
            module + '/index.js').blackBG.red.bold );
        return false;
    }
}

// Helper method for browserifying things
function browserifyModules ( module, entries, outFile, rules ) {
    var bundle = browserify({
            debug: flags.debug
          , entries: entries
        });

    // Transforms from browserify config
    if ( rules.transforms.length > 0 ) {
        var transformLib;
        rules.transforms.forEach( function ( transform ) {
            // require the library
            transformLib = require( transform );
            // bundle.transform it
            bundle.transform( transformLib );
        });
    }

    if ( flags.minify ) {
        bundle.transform( 'uglifyify' );
    }

    // Require vendor libraries from browserify configs
    rules.requires.forEach( function ( dependency ) {
        bundle.require( dependency );
    });

        // Excludes from browserify configs
    rules.excludes.forEach( function ( exclusion ) {
        bundle.exclude( exclusion );
    });

    // Actually make bundle
    bundle
        .bundle({
            debug: flags.debug
        }, function ( err, data ) {
            if ( err ) throw err;
            console.log( module.yellow + ' bundle created at ' + outFile.replace( __dirname, '' ) );
            return data;
        })
        .pipe( fs.createWriteStream( outFile ) );
}

function concat ( options ) {
    var fileList = options.src
      , outPath = options.dest
      , fileEncoding = 'utf-8'
      , out = fileList.map( function ( filePath ) {
            return fs.readFileSync( vendorPath + filePath, fileEncoding );
        });
    fs.writeFileSync( outPath, out.join( '\n' ), fileEncoding );
}

// Run the program
async.series([
    initFlags,
    initModules,
    build
],
function ( err, results ) {
    if ( err ) {
        console.log( err );
    }
});