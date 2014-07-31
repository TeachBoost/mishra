// configure.js
// Copies environment file to config file
// node configure.js <profile>

// Set environment based on [current path (user)]

var
    fs = require('fs'),
    env = 'development',
    currentpath = process.env.PWD,
    envpath = currentpath + '/../env/';

if (process.argv.length > 2){
    env = process.argv[2];
}

envpath += env;

// Check if profile exists
if (fs.existsSync(envpath)) {
    console.log("Attempting to create config from " + env);
    // Copy the file to config
    fs.createReadStream(envpath).pipe(fs.createWriteStream(currentpath + '/../config'));
    console.log("Config file created from " + env);
} else {
    console.log("ERROR: Environment file '" + env + " not found");
}
