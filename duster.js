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
    if (ignores[regex].exec(filename)) {
      return true;
    }
  }

  // All have been checked. We're good to go!
  return false;
}

function compileDust(path, curr, prev) {

  // Check if we should ignore the file.
  if (shouldIgnore(ignoreRegexes, path)) {
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
    var compiled;

    try {
      compiled = dust.compile(new String(data), filename);

      fs.writeFile(filepath, compiled, function(err) {
        if (err) {
          growl('Error: ' + err, { sticky: true });
          throw err;
        }

        growl('Saved ' + filepath);

      });

    } catch (err) {
      growl('Error: ' + err, { sticky: true });
    }

  });
}

function createMonitor(settings) {

  watch.createMonitor(settings.input_path, {
    'ignoreDotFiles': true
  }, function(monitor) {
    monitor.files['*.dust', '*/*'];
    monitor.on("created", compileDust);
    monitor.on("changed", compileDust);
  });
}

function processCurrentFiles(settings) {
  fs.readdir(settings.input_path, function (err, files) {
    if (!err) {
      files.forEach(function (filename) {
        var dustFile;

        if (!dustRegex.exec(filename)) {
          return;
        }
        dustFile = filename.replace('.dust', '') + '.js';
        fs.stat(fileOptions.output_path + '/' + dustFile, function(err, props) {
          if (err) {
            console.log('file not found: ' + fileOptions.output_path + '/' + dustFile);
            compileDust(fileOptions.input_path + '/' + filename);
          }
        });
      });
    }
  });
}

function startWatch(settings) {
  growl('Watching ' + settings.input_path + ' for changes');

  processCurrentFiles(settings);
  createMonitor(settings);
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
          doc = JSON.parse(data);

          if (doc.input_path) {
            fileOptions.input_path = doc.input_path;
          }

          if (doc.output_path) {
            fileOptions.output_path = doc.output_path;
          }

          startWatch(fileOptions);

        } catch (err) {
          // Not sure why this is here, but I'll leave it in for now.
          growl('Error: ' + err, { sticky: true });
        }

      });

    } else {
      // Er... This happened. Just deal with it, okay?
      startWatch(fileOptions);

    }
  });
}

// Run the main function if this is being invoked as a script.
if (require.main === module) {
  main();
}
