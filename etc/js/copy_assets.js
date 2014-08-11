/**
 * copy_assets.js
 * Copies images and fonts to build directory
 *
 * To run:
 * $> node etc/js/copy_assets.js
 */
'use strict';

var fs = require( 'fs' )
  , _ = require( 'underscore' )
  , mkdirp = require( 'mkdirp' )
  , ncp = require( 'ncp' ).ncp
  , async = require( 'async' )
  , colors = require( 'colors' );

// set up paths and config
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
  , appPath = scriptPath + '/' + settings.devPaths.appPath
  , vendorPath = scriptPath + '/' + settings.devPaths.vendorPath
  , buildPath = scriptPath + '/' + settings.devPaths.buildPath
  , modules = _.keys( settings.modules );

// Create buildpath if it doesn't exist
mkdirp( buildPath + 'img' );
mkdirp( buildPath + 'fonts' );

// Run these sequentially
async.series([
    copyVendorImages,
    copyModuleImages,
    copyVendorFonts
],
function ( err, results ) {
    if ( err ) {
        console.log( err );
    }
});

// Copy images specified in the config settings. These are
// images pulled into the vendor folder.
function copyVendorImages ( callback ) {
    if ( ! settings.base.img.value.length ) {
        console.log( ('No vendor images to copy, skipping.').grey );
    }
    else {
        settings.base.img.value.forEach( function ( imgInfo ) {
            mkdirp( buildPath + 'img/' + imgInfo.target, function ( err ) {
                if ( err ) {
                    console.error( ('ERROR: ' + err).blackBG.red.bold );
                }
                else {
                    console.log( 'Copying vendor images from ' + imgInfo.target );
                    copyAssets(
                        vendorPath + imgInfo.source,
                        buildPath + 'img/' + imgInfo.target + '/',
                        'base' );
                }
            });
        });
    }
    callback( null, 'Vendor images copied' );
}

// Copy images from the module config.
function copyModuleImages ( callback ) {
    _.each( modules, function ( module ) {
        copyAssets(
            appPath + 'modules/' + module + '/images/',
            buildPath + 'img/',
            module );
    });
    callback( null, 'Base images copied' );
}

// Copy vendor fonts into build/public/fonts
function copyVendorFonts ( callback ) {
    if ( ! settings.base.fonts.value.length ) {
        console.log( ('No vendor fonts to copy, skipping.').grey );
    }
    else {
        console.log( 'Copying vendor fonts for base module' );
        settings.base.fonts.value.forEach( function ( fontFile ) {
            // fonts all reside at top level of /fonts
            var outFile = fontFile.split( '/' ).pop();
            // TODO: Add check to see if file exists first?
            fs.createReadStream( vendorPath + fontFile )
                .pipe(
                    fs.createWriteStream(
                        buildPath + 'fonts/' + outFile
                    ));
        });
    }
    callback( null, 'Fonts copied' );
}

// Copy directories, checking if files exist first
function copyAssets( readDir, writeDir, module ) {
    fs.readdir( readDir, function ( err, assets ) {
        if ( err ) {
            console.log( ('ERROR: '. module + ' asset directory not found').blackBG.red.bold );
        }
        else if ( assets.length > 0 ) {
            ncp( readDir, writeDir, function ( err ) {
                if ( err ) {
                    return console.error( ('ERROR: '. err).blackBG.red.bold );
                }
            });
        }
        else  {
            console.log( ('No image files found in module ' + module + ', skipping.').grey );
        }
    });
}