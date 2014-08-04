
// packages node modules, other vendor js, and custom js using Browserify
// to run:
// $ node build.js

var 
    fs              = require('fs'),
    Prompt          = require('prompt-improved'),
    defaults        = JSON.parse(fs.readFileSync('../defaults.json', 'utf8')),
    dependencies    = defaults.dependencies,
    currentPath     = process.env.PWD,
    paths           = defaults.paths,
    settings        = defaults.settings,
    module          = "base",
    outFile         = "";

// Asynchronosly run build tasks

// 1. Check if dependencies are installed

// checkDependencies();

// 2. Which Module to build?
// 3. Minify, debug?
if (process.argv.length > 2){
    module = process.argv[2];

} else {
    var prompt = new Prompt({
        prefix: '[?] ',
        prefixTheme : Prompt.chalk.green,
        textTheme   : Prompt.chalk.bold.green
    });

    prompt.ask([{
        question: 'Build which module? [base, home, design, work, all]\n\n',
        key: 'module',
        required: true,
        boolean: false
    },{
        question: 'Debug Mode? [Y/N]',
        key: 'debug',
        required: true,
        default: 'Y',
        boolean: true
    },{
        question: 'Minify? [Y/N]/n',
        key: 'minify',
        required: true,
        default: 'Y',
        boolean: true
    }], function(err, res) {
        if (err) return console.error(err);
        console.log('Module: ' + res.module);
        console.log('Debug: ' + res.debug);
        console.log('Minify: ' + res.minify);
        module = res.answer;
    });

}

// 4. Build Module
if (module === "base" || module === "all") {
        
        outFile = "base.js";
        
        // 4.1 browserify the base javascript
        browserify(paths, dependencies, outfile);
        
        // 4.2 Copy any JS files
        if (settings.jsFiles.length > 0) {

            var vendorPath  = paths.rootPath+paths.vendorPath,
                jsPath      = paths.rootPath+paths.buildPath + "js/";

            settings.jsFiles.forEach(function(jsFile) {
                console.log(jsFile);
                fs.createReadStream(vendorPath+jsFile).pipe(fs.createWriteStream(jsPath+jsFile));
            });
        }

        // 4.3 Copy any CSS files
            // 4.3.1 Make empty base file
            // (may not need, combine with 4.3.3)
            fs.open(paths.buildPath + 'css/base.css', 'w');

            // 4.3.2 Concatenate any vendor files

            // 4.3.3 Compile the LESS files into base.css


} else {
    buildModules(module);
}

if (module === "all") {
    buildModules(settings.module.value);
}

function buildModules(modules) {
    // Create javascript bundle using browserify

    // Create the module-specific CSS
}

// Check if dependencies are installed
function checkDependencies() {
    var checker;
    try {
        checker = require( 'browserify' );
    }
    catch( e ) {
        if ( e.code === 'browserify not found! please npm install -g browserify' ) {
        }
    }

    try {
        checker = require( 'lessc' );
    }
    catch( e ) {
        if ( e.code === 'less not found! please npm install -g less' ) {
        }
    }
}

function browserify(paths, dependencies, outfile) {

    var browserify = require('browserify'),
        ractify = require('ractify'),
        bundle = browserify();

    // Require vendor and custom libraries and make them available outside the bundle.

    dependencies.forEach(function(dependency) {
        // console.log(dependency.require + ", " + dependency.expose);
        if (dependency.expose) { 
            bundle.require(dependency.require, { expose: dependency.expose }); 
        }
        else { 
            bundle.require(dependency.require); 
        }
    });

    // Make .ract templates play nice
    bundle.transform(ractify);

    // Actually make bundle
    bundle
    .bundle({ 
        debug: true,
        entries: [paths.rootPath + 'gulpfile.js'] ,
        // basedir: ['/Users/talia/Projects/moxies/mox/']
    })
    .pipe(fs.createWriteStream(paths.rootPath+paths.buildPath + '/' + outFile + '.js'));
}


