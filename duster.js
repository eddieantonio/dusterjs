// # duster.js  
//
// Watch directory of dust.js templates and automatically compile them
// by Dan McGrady http://dmix.ca
// Modifications by Suresh Jayanty
// Additional modifications by Eddie Antonio Santos <easantos@ualberta.ca>
var fs = require('fs')
  , dust = require('dustjs-linkedin')
  , watch = require('watch')
  , growl = require('growl')
  , colors = require('colors')
  , childprocess = require('child_process')

  , fileOptions = {
    'input_path': './src.dust',
    'output_path': './dust'
  }
  // Shouldn't this be in CWD?
  , userSettingsFile = process.cwd() + '/.dusterjs'
  , ignoreRegexes = {
      'svn': /\.svn/
    , 'swp': /\.swp/
    , 'git': /\.git/
    }
  , dustRegex = /\.dust$/
  ;

/**
 * Determines whether the filename should be ignored, determined by the given
 * `ignore` object of regexes.
 */
function shouldIgnore(ignores, filename) {
  var regex;

  // Check the filename against EVERY regex.
  for (regex in ignores) {
    if (filename.match(regex)) {
      return true;
    }
  }

  // All have been checked. We're good to go!
  return false;
}

function compileDust(path, curr, prev) {

  // Check if we should ignore the file.
  if (shouldIgnore(ignoreRegexes, path)) {
    console.log(('Ignoring file: ' + path).red);
    return;
  }

  // Read the file.
  fs.readFile(path, function(err, data) {
    if (err) {

      growl('Error: ' + err + ' : ' + path , { sticky: true });
      throw err;
    }

    var filename = path.split("/").reverse()[0].replace(".dust", "");
    var filepath = fileOptions.output_path +  '/' + filename + ".js";
    var compiled = '';
    try {
      compiled = dust.compile(new String(data), filename);

      fs.writeFile(filepath, compiled, function(err) {
        if (err) {
          growl('Error: ' + err, { sticky: true });
          throw err;
        }
        console.log('Saved ' + filepath);
        growl('Saved ' + filepath);
      });

    } catch (err) {
      growl('Error: ' + err, { sticky: true });
    }

  });
}

function createMonitor() {
  try {
    watch.createMonitor(fileOptions.input_path, {
      'ignoreDotFiles': true
    }, function(monitor) {
      console.log("Watching " + fileOptions.input_path);
      monitor.files['*.dust', '*/*'];
      monitor.on("created", compileDust);
      monitor.on("changed", compileDust);
    });
  } catch (err) {
    growl('Error: ' + err, { sticky: true });
    console.log(err);
  }
}

function processCurrentFiles() {
  fs.readdir(fileOptions.input_path, function(err, files) {
    if(!err) {
      files.forEach(function(filename) {
        var dustFile;
        if(!dustRegex.exec(filename)) {
          return;
        }
        dustFile = filename.replace('.dust', '') + '.js';
        fs.stat(fileOptions.output_path + '/' + dustFile, function(err, props) {
          if(err) {
            console.log('file not found: ' + fileOptions.output_path + '/' + dustFile);
            compileDust(fileOptions.input_path + '/' + filename);
          }
        });
      });
    }
  });
}

function main() {
  fs.exists(userSettingsFile, function(exists) {
    if (exists) {
      fs.readFile(userSettingsFile, 'utf8', function(err, data) {
        var doc;

        if (err) {
          return;
        }

        try {
          // TODO: use JSON instead
          doc = JSON.parse(data) 
          
          // This used to be a callback; now it's an IIFE.
          (function(doc) {

            if (doc.input_path) {
              fileOptions.input_path = doc.input_path;
            }

            if (doc.output_path) {
              fileOptions.output_path = doc.output_path;
            }

            growl('Watching ' + fileOptions.input_path + ' for changes');
            growl('Saving compiled templates to ' + fileOptions.output_path);

            processCurrentFiles();
            createMonitor();
          })(doc);

        } catch (err) {
          // Not sure why this is here, but I'll leave it in for now.
          growl('Error: ' + err, { sticky: true });
        }

      });

    } else {
      growl('Watching ' + fileOptions.input_path + ' for changes');
      growl('Saving compiled templates to ' + fileOptions.output_path);

      processCurrentFiles();
      createMonitor();
    }
  });
}

main();
