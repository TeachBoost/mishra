// init.js
// Set up directories and the environment

var
    fs              = require('fs'),
    mkdirp          = require('mkdirp'),
    async           = require('async'),
    scriptPath      = __dirname + "/",
    defaults        = JSON.parse(fs.readFileSync(scriptPath + '/../defaults.json', 'utf8')),
    config          = JSON.parse(fs.readFileSync(scriptPath + '/../config.json', 'utf8')),
    paths           = defaults.paths,
    appPath         = scriptPath + paths.appPath,
    modules         = config.modules.value,
    vendorPath      = scriptPath + "/" + paths.vendorPath,
    buildPath       = scriptPath + "/" + paths.buildPath,
    assets;

// Create buildpath if it doesn't exist
mkdirp(buildPath+'/img');
mkdirp(buildPath+'/fonts');

modules = modules.map(function(module) {return 'modules/' + module});
modules.unshift('base');
console.log(modules);

async.each(modules, function(module, callback) {
    fs.readdir(appPath + '/' + module + '/images', function(err, assets) {
        if (err) {
            console.log(module + ' directory not found');
        }
        else if (assets.length > 0) {
            console.log('Copying ' + module + ' assets'); 
            copyAssets(appPath + '/' + module + '/images/', buildPath + '/img/', assets);
        } else  {
            console.log ('no image files found in ' + module + ', skipping');
        }   
    });
}, function(err) {
    if(err) {
        console.log('A file failed to process. ERROR: ', err);
    }
});


function copyAssets(readDir, writeDir, assets) {
    assets.forEach(function(asset) {
        fs.createReadStream(readDir + asset)
          .on('error', function(err) {throw err;})
          .pipe(fs.createWriteStream(writeDir + asset)
                  .on('error', function(err) {throw err;}));
          // .on('finish', function() {})
    });
}


// Check if config file exists
// if (!fs.existsSync(configPath)) {
//     console.log(configPath);
//     return console.log("ERROR: Config file not found. Please run node configure.js <profile>");
// } else {
//     // Make all the directories listed in dirs.
//     // Uses async so that creating the index.less file doesn't happen
//     // until all the parent directories are created.
//     async.map(dirs, mkdirp, function (err, results) {
//         // Create style.less file
//         if (!fs.existsSync(appPath + 'base/styles/index.less')) {
//             fs.open(appPath + 'base/styles/index.less', 'w');
//         }
//     });
// }


