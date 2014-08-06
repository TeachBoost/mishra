/**
 * Packages node modules, other vendor js, and custom js
 * using Browserify.
 *
 * To run:
 * $> node etc/js/build.js
 */

 'use strict';

// required before all
var fs = require( 'fs' )
  , _ = require( 'underscore' )
  , async = require( 'async' )
  , mkdirp = require( 'mkdirp' )
  , childProcess = require( 'child_process' )
  , browserify = require( 'browserify' )
  , scriptPath = __dirname;

// check if config files exist
// @TODO
var config = JSON.parse( fs.readFileSync( scriptPath + '/../config.json', 'utf8' ) )
  , defaults = JSON.parse( fs.readFileSync( scriptPath + '/../defaults.json', 'utf8' ) )
  , settings = _.extend( defaults, config );

// pull out paths
var basePath = scriptPath + '/' + settings.paths.basePath
  , modulePath = scriptPath + '/' + settings.paths.modulePath
  , vendorPath = scriptPath + '/' + settings.paths.vendorPath
  , buildPath = scriptPath + '/' + settings.paths.buildPath;

var flags = { 'debug' : false, 'minify' : false };

// Determine which module to build. If script is run with and
// argument, use that. Possible flags are minify or debug.
//
// TODO: minify and debug flags aren't being passed to browserify yet.
// TODO: prompt is kind of janky, find replacement? other ways to
//       provide convenience to user?
if ( process.argv.length > 2 ) {
    var index;

    process.argv.splice(0,2);

    index = process.argv.indexOf ( '--debug' );
    if ( index > -1 ) {
        process.argv.splice( index, 1 );
        flags.debug = true;
    }

    index = process.argv.indexOf ( '--minify' );
    if ( process.argv.indexOf ( '--minify' ) > -1 ) {
        process.argv.splice( index, 1 );
        flags.minify = true;
    }

    if ( process.argv.indexOf ( 'base' ) <= -1 ) {
        process.argv.unshift( 'base' );
    }

    console.log( 'Attempting to build modules: ' + process.argv.join( ', ' ) );
    process.argv.forEach( function ( module ) {
        builder( module, flags );
    });
}
else {
    console.log ( 'Building base' );
    // builder( 'base' );

}


function builder ( module, flags ) {
    // create asset folders
    mkdirp( buildPath + '/js' );
    mkdirp( buildPath + '/css' );

    if ( module === 'base' || module === 'all' ) {
        buildBase( flags );
    }
    else {
        buildModule( module, flags );
    }

    if ( module === 'all' ) {
        settings.modules.forEach( function ( mod ) {
            buildModule( mod );
        });
    }
}

function buildBase ( flags ) {
    console.log( flags );
    browserifyBase( );

    async.series([
        copyJsFiles,
        lessCssFiles,
        copyCssFiles
    ], function ( err, results ) {
        if ( err ) console.log( err );
        console.log( results );
    });
}

function buildModule ( module, flags ) {
    console.log( flags );
    // check that module path exists
    if ( fs.existsSync( modulePath + module + '/index.js' ) ) {
        browserifyModule( module );

        // TODO:    Get lessCssFiles working first, then add logic for module
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
    if ( config.base.js.value.length > 0 ) {
        var jsPath = buildPath + '/js/';

        config.base.js.value.forEach(
            function ( jsFile ) {
                fs.createReadStream( vendorPath + jsFile.source )
                    .pipe( fs.createWriteStream( jsPath + jsFile.target ) );
            });
    }

    // callback(new Error( 'This is a test' ));
    callback( null, 'Vendor Js files copied');
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
            ( ( module === 'base' ) ? basePath : modulePath + module + '/' ) + 
            'styles/index.less'
      , outFile = buildPath + 'css/' + module + '.css'
      , command = 'lessc ' + inFile + ' ' + outFile ;
        // Run the command

    var lesscProcess = childProcess.exec(
        command,
        function ( error, stdout, stderr ) {
            console.log( stdout );
            console.log( stderr );
            if ( error !== null ) {
                console.log( 'exec error: ' + error);
            }
        });

    lesscProcess.on( 'close', function ( ) {
        console.log( 'Completed less and added to' + outFile );
    });
}

function browserifyBase ( ) {
    var bundle = browserify( {
            debug: true,
            entries: [scriptPath + '/../../junk.js'] ,
            transform: 'ractify' // @TODO this should be pulled from transforms
        } );

    // Make .ract templates play nice
    var transformLib = require( $transform );
    bundle.transform( transformLib );
    bundle.transform( ractify ); // @TODO see above

    // Require vendor libraries
    // @TODO this should read from the browserify config and add the
    //       requires, transforms and exludees
    settings.base.browserify.requires.forEach( function ( dependency ) {
        bundle.require( dependency.require );
    });

    // Actually make bundle
    bundle
        .bundle( function ( err, data ) {
            if ( err ) throw err;
            return data;
        })
        .pipe( fs.createWriteStream( buildPath + 'js/base.js' ) );
}

function browserifyModule ( module ) {
    var bundle = browserify({
        debug: true,
        entries: [ modulePath + module + '/index.js' ] ,
        transform: 'ractify'
        // basedir: ['/Users/talia/Projects/moxies/mox/']
    });

    bundle.transform( ractify );
    bundle
        .bundle( function ( err, data ) {
            // TODO:    DEBUG, getting SyntaxError when trying with eagle design
            //          module. not great error messaging though. design.js is
            //          being created but is empty except for browserify wrapper
            if ( err ) {
                console.log( 'module error' );
                throw err;
            }
            return data;
        })
        .pipe( fs.createWriteStream( buildPath + 'js/' + module + '.js' ) );

    // NOTE: do not write file if the writestream is empty?
}

function concat ( options ) {
    var fileList = options.src
      , outPath = options.dest
      , fileEncoding = 'utf-8'
      , out = fileList.map( function ( filePath ) {
            return fs.readFileSync( vendorPath + filePath, fileEncoding );
        });

    // console.log(fileList);
    fs.writeFileSync( outPath, out.join( '\n' ), fileEncoding );
    console.log( ' '+ outPath +' built.' );
}