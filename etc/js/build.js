/**
 * Packages node modules, other vendor js, and custom js
 * using Browserify.
 *
 * To run:
 * $> node build.js
 */
var fs = require( 'fs' )
  , Prompt = require( 'prompt-improved' )
  , less = require( 'less' )
  , async = require( 'async' )
  , mkdirp = require( 'mkdirp' )
  , childProcess = require( 'child_process' )
  , browserify = require( 'browserify' )
  , ractify = require( 'ractify' )
  , scriptPath = __dirname
  , config = JSON.parse( fs.readFileSync( scriptPath + '/../config.json', 'utf8' ) )
  , defaults = JSON.parse( fs.readFileSync( scriptPath + '/../defaults.json', 'utf8' ) )
  , dependencies = config.base.dependencies
  , modules = config.modules
  , settings = defaults.settings
  , paths = defaults.paths
  , basePath = scriptPath + "/" + paths.basePath
  , modulePath = scriptPath + "/" + paths.modulePath
  , vendorPath = scriptPath + "/" + paths.vendorPath
  , buildPath = scriptPath + "/" + paths.buildPath
  , outFile = "";

// Determine which module to build. If script is run with and
// argument, use that. Possible flags are minify or debug.
//
// TODO: minify and debug flags aren't being passed to browserify yet.
// TODO: prompt is kind of janky, find replacement? other ways to
//       provide convenience to user?
if ( process.argv.length > 2 ) {
    var module = process.argv[ 2 ];
    console.log(process.argv);
    builder( process.argv[ 2 ] );
}
else {
    var prompt = new Prompt({
        prefix: '[?] ',
        prefixTheme : Prompt.chalk.green,
        textTheme   : Prompt.chalk.bold.green
    });

    prompt.ask([{
        question: 'Build which module? [base, ' + modules.value.join( ', ' ) + ', all]\n\n',
        key: 'module',
        default: 'base',
        required: true,
        boolean: false
    }, {
        question: 'Debug Mode? [y/N]',
        key: 'debug',
        required: true,
        default: 'N',
        boolean: true
    }, {
        question: 'Minify? [Y/n]/n',
        key: 'minify',
        required: true,
        default: 'Y',
        boolean: true
    }], function( err, res ) {
        if ( err ) return console.error( err );
        console.log( 'Module: ' + res.module );
        console.log( 'Debug: ' + res.debug );
        console.log( 'Minify: ' + res.minify );
        builder( res.module );
    });
}

var builder = function ( module ) {
    // create asset folders
    mkdirp( buildPath + '/js' );
    mkdirp( buildPath + '/css' );

    if ( module === 'base' || module === 'all' ) {
        buildBase();
    }
    else {
        buildModule( module );
    }

    if ( module == 'all' ) {
        modules.forEach( function( mod ) {
            buildModule( mod );
        });
    }
}

var buildBase = function () {
    // TODO: Update outfile to 'base.js' at some point
    var outFile = "xxxxx.js";

    browserifyBase( paths, dependencies, outFile );

    async.series([
        copyJsFiles,
        copyCssFiles,
        lessCssFiles
    ], function ( err, results ) {
        if ( err ) console.log( err );
        console.log( results );
    });
}

var buildModule = function ( module ) {
    // check that module path exists
    if ( fs.existsSync( modulePath + module + '/index.js' ) ) {
        browserifyModule( module );
        // TODO:    Get lessCssFiles working first, then add logic for module
        // lessCssFiles(null, module);
    }
    else {
        throw new Error(
            'Module does not seem to exist. Looked for ' + modulePath +
            module + '/index.js' );
    }
}

// Copy any JS files
var copyJsFiles = function ( callback ) {
    if ( config.base.js.value.length > 0 ) {
        var jsPath = buildPath + "/js/";

        config.base.js.value.forEach(
            function( jsFile ) {
                fs.createReadStream( vendorPath + jsFile.source )
                    .pipe( fs.createWriteStream( jsPath + jsFile.target ) );
            });
    }
    
    // callback(new Error( 'This is a test' ));
    callback( null, 'Vendor Js files copied to ' + jsPath );
}

// Copy and concatenate any CSS files into base.css
var copyCssFiles = function ( callback ) {
    if ( config.base.css.value.length > 0 ) {
        var cssPath = buildPath + "css/base.css";
        concat({
            src: config.base.css.value,
            dest: cssPath
        });
    }

    callback( null, 'Vendor CSS files concatenated into base.css' );
}

// Compile the LESS files and concatenate into base.css
// NOTE: Currently writing to 'clams.css' because ...
// TODO: If using command line exec of less, the native implementation
//       will overwrite the existing base.css (not sure if there is a
//       flag to append to the end of file. Other options: 1) make temp file,
//       then concat file to base, then delete file?
var lessCssFiles = function ( callback, module ) {
    var inputFile = basePath + 'styles/index.less'
      , outputFile = buildPath + "css/clams.css"
        // command should be format of
        // command = 'lessc -x ' + inputFile.replace(/\s+/g,'\\ ' ) + outputFile.replace(/\s+/g,'\\ ' )+'.css';
      , command = 'lessc ' + inputFile + ' ' + outputFile ;
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

    lesscProcess.on( 'close', function ( code ) {
        console.log( 'Completed less and added to' + outputFile );
    });

    //--------------TRY USING less.parser------------------------------------//
    // NOTE: using the parser requires reading the file in; I wasn't able to
    // get this to work with a filename (it tries to parse the literal
    // filename) PLUS it barfs on the imports (includes them in the final
    // file as [Object] [object])

    // var lessInput = fs.readFileSync(basePath + 'styles/index.less', 'utf8' );

    // var parser = new(less.Parser)({
    //     paths: [basePath + 'styles/'] // Specify search paths for @import directives
    // });

    // parser.parse(lessInput, function (err, css) {
    // // concatenate to existing base css
    //     if (err) throw err;
    //     fs.appendFile(buildPath + "css/base.css", '\n' + css, function (err) {
    //         if (err) throw err;
    //         console.log( 'css appended' );
    //     });
    // });

    //--------------TRY USING less.render------------------------------------//
    // NOTE: using the parser requires reading the file in; barfs on imports,
    // returns with error 'common.less' wasn't found. Options: 1. change paths
    // in index.less?

    // var lessInput = fs.readFileSync(basePath + 'styles/index.less', 'utf8' );

    // less.render(lessInput, function (err, css) {
    //     // concatenate to existing base css
    //     if (err) throw err;
    //     fs.appendFile(buildPath + "css/base.css", '\n' + css, function (err) {
    //         if (err) throw err;
    //         console.log( 'css appended' );
    //     });
    // });

    //--------------OLD CODE, OK TO IGNORE-----------------------------------//

    // if (typeof module !== "undefined") {

        // var d           = domain.create();

        // // Domain & process error management
        // d.on( 'error', function(error) {
        //     if (error.code === 'ENOENT' ) {
        //         console.error( 'file not found, skipping' )
        //     } else {
        //         throw error;
        //     }
        // });
        // process.on( 'uncaughtException', function(error) {
        //   console.error( 'Caught error in process, but not exiting' );
        // });

        // readFile(modulePath + module + '/styles/index.less' );

        // // Check if there is a styles.less file in the module directory
        // function readFile(filename, callback) {
        //     fs.readFile(filename, 'utf-8', d.intercept(function(data) {
        //         // console.log(data);
        //         makeCss(data);
        //     }));
        // }

        // function makeCss(file) {
        //     less.render(file, function (err, css) {
        //         if (err) throw err;
        //         // appendFile will create file if it doesn't exist, setting up this way
        //         // for more flexibility in future
        //         fs.appendFile(buildPath + "css/" + module + ".css", css, function (err) {
        //             if (err) throw err;
        //             console.log(module + '.css created' );
        //             d.dispose();
        //         });
        //     });
        // }

        // try {

            // fs.open(modulePath + module + '/styles/index.less', 'r', function(err, buffer) {
            //  if (err)  console.log(err);
            //  console.log(buffer.toString());

            // });

        // if(fs.existsSync(modulePath + module + '/styles/index.less' )) {
        //     console.log( 'yes' );

        // } else { console.log ( 'nope' );}
        // } catch(err) {
        //     console.log( 'Error' + e );
        // }

        // try {
        //     var data = fs.readFileSync(modulePath + module + '/styles/index.less', 'utf-8' );
        // } catch(err) {
        //     console.log(err);

        // }

        // fs.readFile(modulePath + module, {}, function (err, data) {
        //   if (err) console.log(err);
        //   console.log(data);
        // });

        // var data = fs.exists(modulePath + module, function(exists) {
        //     if (exists) {
        //         console.log( 'yay' );
        //     } else {
        //         console.log( 'boo' );
        //     }
        // }).on( 'error', function(err) {
        //     console.log(err);
        // });

        // fs.readFile(modulePath + module + '/styles/index.less' , 'utf-8', function(err,file){
        //     // no need to throw error, just return
        //     if (err) return console.error(err);
        //     var data = file.toString();
        //     console.log(data);
        // });
    // }

    // else {
    //     // get a list of .less files from the directory
    //     fs.readdir(basePath + 'styles/', function(err, files) {
    //         if (err) {throw err;}

    //         if (files.length > 0) {

    //             files.map(function(file) {
    //                 // need the file contents, not the file names
    //                 return fs.readFileSync(basePath + 'styles/' + file, 'utf8' );
    //             }).forEach(function (file) {
    //                 // compile each less file
    //                 // NOTE: Assume base less has imports (don't need to read directory)
    //                 // And less smart enough to concat onto existing file
    //                 less.render(file, function (err, css) {
    //                     // concatenate to existing base css
    //                     if (err) throw err;
    //                     fs.appendFile(buildPath + "css/base.css", '\n' + css, function (err) {
    //                         if (err) throw err;
    //                         console.log( 'css appended' );
    //                     });
    //                 });

    //             });

    //         }
    //         callback();
    //     });
    // }
}

var browserifyBase = function ( paths, dependencies, outFile ) {
    var bundle = browserify({
        debug: true,
        entries: [scriptPath + '/../../junk.js'] ,
        transform: 'ractify'
    });

    // Make .ract templates play nice
    bundle.transform( ractify );

    // Require vendor and custom libraries and make them available
    // outside the bundle.
    dependencies.map( function( dependency ) {
        // check if there are vendor files
        if ( dependency.require.match( '\/vendor\/' ) ) {
            //if so, have to update the directory so it's relative to the
            // where the script is called
            dependency.require = ( __dirname + '/' + dependency.require );
            return dependency;
        }
        else {
            return dependency;
        }
    }).forEach( function( dependency ) {
        // console.log(dependency.require + ", " + dependency.expose);
        if ( dependency.expose ) {
            bundle.require(
                dependency.require, {
                    expose: dependency.expose
                });
        }
        else {
            bundle.require( dependency.require );
        }
    });

    // Actually make bundle
    bundle
        .bundle( function ( err, data ) {
            if ( err ) throw err;
            return data;
        })
        .pipe( fs.createWriteStream( buildPath + 'js/' + outFile ) );
}

var browserifyModule = function ( module ) {
    var bundle = browserify({
        debug: true,
        entries: [modulePath + module + '/index.js'] ,
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

var concat = function ( options ) {
    var fileList = options.src
      , outPath = options.dest
      , fileEncoding = 'utf-8'
      , out = fileList.map( function( filePath ) {
            return fs.readFileSync( vendorPath + filePath, fileEncoding );
        });

    // console.log(fileList);
    fs.writeFileSync( outPath, out.join( '\n' ), fileEncoding );
    console.log( ' '+ outPath +' built.' );
}