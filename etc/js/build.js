/*
 *  build.js
 *  Packages node modules, other vendor js, and custom js
 *  using Browserify.
 *
 *  To run:
 *  $> node etc/js/build.js [--debug] [--minify] [module|all]
 */


'use strict';

// required before all
var fs = require( 'fs' )
  , _ = require( 'underscore' )
  , async = require( 'async' )
  , mkdirp = require( 'mkdirp' )
  , childProcess = require( 'child_process' )
  , browserify = require( 'browserify' );

var scriptPath = __dirname;

// check if config files exist
var config = JSON.parse(
        fs.readFileSync( scriptPath + '/../config.json', 'utf8' ) )
  , defaults = JSON.parse(
        fs.readFileSync( scriptPath + '/../defaults.json', 'utf8' ) )
  , settings = _.extend( defaults, config );

// pull out paths
var basePath = scriptPath + '/' + settings.devPaths.basePath
  , modulePath = scriptPath + '/' + settings.devPaths.modulePath
  , vendorPath = scriptPath + '/' + settings.devPaths.vendorPath
  , buildPath = scriptPath + '/' + settings.devPaths.buildPath;


var flags = { 'debug' : false, 'minify' : false };

// Determine which module to build. If script is run with and
// argument, use that. Possible flags are minify or debug.
//
// TODO: Check if debug flag is properly being passed to browserify.

console.log( '\n======================================================' );

if ( process.argv.length > 2 ) {
    var index;

    process.argv.splice( 0,2 );

    index = process.argv.indexOf( '--debug' );
    if ( index > -1 ) {
        process.argv.splice( index, 1 );
        flags.debug = true;
    }

    index = process.argv.indexOf( '--minify' );
    if ( process.argv.indexOf( '--minify' ) > -1 ) {
        process.argv.splice( index, 1 );
        flags.minify = true;
    }

    if ( process.argv.length === 0 ||
            ( process.argv.indexOf( 'all' ) > -1 &&
                process.argv.indexOf( 'base' ) <= -1 ) ) {
        process.argv.unshift( 'base' );
    }

    console.log( 'Attempting to build modules: ' + process.argv.join( ', ' ) );
    process.argv.forEach( function ( module ) {
        builder( module );
    } );
}
else {
    console.log( 'Attempting to build base' );
    builder( 'base' );

}


function builder ( module ) {
    console.log( flags );

    // create asset folders
    mkdirp( buildPath + '/js' );
    mkdirp( buildPath + '/css' );

    if ( module === 'base' ) {
        buildBase( );
    }
    else if ( module === 'all' ) {
        _.each( settings.modules, function ( value, key ) {
            buildModule( key );
        });
    }
    else {
        buildModule( module );
    }


        // settings.modules.forEach( function ( mod ) {
        //     buildModule( mod );
        // } );
}

function buildBase ( ) {

    //  browserifyModules(module, entries, outFile, settings)
    browserifyModules(
        'base',
        [ scriptPath + '/../../junk.js' ],
        buildPath + 'js/base.js',
        settings.base.browserify
    );

    async.series( [
        copyJsFiles,
        lessCssFiles,
        copyCssFiles
    ], function ( err, results ) {
        if ( err ) { console.log( err ); }
        console.log( results.join( '\n' ) );
    } );
}

function buildModule ( module ) {

    // check that module path exists
    if ( fs.existsSync( modulePath + module + '/index.js' ) ) {

        browserifyModules(
            module,
            [ modulePath + module + '/index.js' ],
            buildPath + 'js/' + module + '.js',
            settings.modules[module].browserify
        );

        lessCssFiles( null, module );
    }
    else {
        throw new Error(
            'Module does not seem to exist. Looked for ' + modulePath +
            module + '/index.js' );
    }
}

// Copy any JS files
function copyJsFiles ( callback ) {
    var jsPath = buildPath + 'js/';

    if ( config.base.js.value.length > 0 ) {
        config.base.js.value.forEach(
            function ( jsFile ) {
                fs.createReadStream( vendorPath + jsFile.source )
                    .pipe( fs.createWriteStream( jsPath + jsFile.target ) );
            } );
    }

    // callback(new Error( 'This is a test' ));
    callback( null,
        'Vendor JS files copied to ' + jsPath.replace( __dirname, '' )
    );
}

// Copy and concatenate any CSS files into base.css
function copyCssFiles ( callback ) {
    if ( config.base.css.value.length > 0 ) {
        var cssPath = buildPath + 'css/base.css';
        concat( {
            src: config.base.css.value,
            dest: cssPath
        } );
    }

    callback( null, 'Vendor CSS files concatenated into base.css' );
}

// Compile the LESS files and concatenate into base.css
function lessCssFiles ( callback, module ) {
    var inFile =
            ( ( module === undefined ) ? basePath :
                modulePath + module + '/' ) +
                'styles/index.less'
      , outFile = ( module === undefined ) ?
            buildPath + 'css/base.css' :
            buildPath + 'css/' + module + '.css'
      , command = 'lessc ' + inFile + ' ' + outFile;
        // Run the command

    var lesscProcess = childProcess.exec(
        command,
        function ( error, stdout, stderr ) {
            if ( stdout ) { console.log( 'stdout: ' + stdout ); }
            if ( stderr ) { console.log( 'stderr' + stderr ); }
            if ( error !== null ) {
                console.log( 'exec error: ' + error );
            }
        } );

    lesscProcess.on( 'close', function ( ) {
        // console.log( 'Completed LESS and added to' + outFile );
    } );
    if ( module === undefined ) {
        callback( null,
            'LESS CSS compiled into ' + outFile.replace( __dirname, '' )
        );
    }
    else {
        console.log( 'LESS CSS compiled into ' +
            outFile.replace( __dirname, '' ) );
    }

}

function browserifyModules ( module, entries, outFile, rules ) {
    var bundle = browserify( {
            debug: flags.debug
          , entries: entries
        } );

    // Transforms from browserify config
    if ( rules.transforms.length > 0 ) {
        var transformLib;
        rules.transforms.forEach( function ( transform ) {
            // require the library
            transformLib = require( transform );
            // bundle.transform it
            bundle.transform( transformLib );
        } );
    }

    if ( flags.minify ) {
        bundle.transform( 'uglifyify' );
    }


    // Excludes from browserify configs
    rules.excludes.forEach( function ( exclusion ) {
        bundle.exclude( exclusion );
    } );

    // Require vendor libraries from browserify configs
    rules.requires.forEach( function ( dependency ) {
        bundle.require( dependency );
    } );

    // Actually make bundle
    bundle
        .bundle( function ( err, data ) {
            if ( err ) { throw err; }
            console.log( module + ' bundle created at' +
                outFile.replace( __dirname, '' ) + '\n' );
            return data;
        } )
        .pipe( fs.createWriteStream( outFile ) );
}

function concat ( options ) {
    var fileList = options.src
      , outPath = options.dest
      , fileEncoding = 'utf-8'
      , out = fileList.map( function ( filePath ) {
            return fs.readFileSync( vendorPath + filePath, fileEncoding );
        } );

    // console.log( fileList );
    fs.writeFileSync( outPath, out.join( '\n' ), fileEncoding );
}
