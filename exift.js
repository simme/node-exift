//
// # Exift
//
// Read EXIF data.
//

//
// ## Constructor
//
// Creates a new Exift object.
//
// If `exiftool` is not in your path do:
//
//     var exif = new Exift();
//     exif.exiftool = '/path/to/exiftool';
//
var Exift = module.exports = function () {
  /* Get dependencies */
  this.lib        = {};
  this.lib.stat   = require('fs').stat;
  this.lib.watch  = require('fs').watchFile;
  this.lib.spawn  = require('child_process').spawn;

  /* Change this if exiftool is not in your path. */
  this.exiftool = 'exiftool';
};

//
// ### Extends EventEmitter
//
require('util').inherits(Exift, require('events').EventEmitter);


//
// ## Read EXIF
//
// Tries to read data from the given path. If successfull the callback
// will recieve the read data.
//
// **parameters**
//
// * path
//
//   Path to the file/directory to read.
//
// * callback
//
//   A function that will be called when data is read. Follows the Node.js
//   standard with an error argument first and result second.
//
Exift.prototype.readData = function (path, fn) {
  var self = this;
  self.lib.stat(path, function (err, stat) {
    if (err) {
      fn(err);
    }
    else {
      var et = self.lib.spawn(self.exiftool, ['-j', '-sort', path]);
      var exif = '';
      var err = '';
      var hasErr = false;

      et.stdout.on('data', function (data) {
        exif += data;
      });

      et.stderr.on('data', function (data) {
        err += data;
        hasErr = true;
      });

      et.on('exit', function (code) {
        if (hasErr && code !== 0) {
          if (err.length === 0) {
            err = 'Exiftool exited with code: ' + code;
          }
          fn(new Error(err));
        }
        else {
          var json = exif.toString();
          fn(null, JSON.parse(json));
        }
      });
    }
  });
};

//
// ## Watch a path
//
// Watches the given path for changes and re-reads exif data.
//
// **parameters** 
//
// * path
//
//   The path to watch.
//
// **events**
//
// * data
//
//   Emitted every time new data is parsed.
//
// * error
//
//   Emitted when readData returns an error.
//
Exift.prototype.watch = function (path) {
  var self = this;
  this.lib.watch(path, function (e, filename) {
    self.readData(path, function (err, data) {
      if (err) {
        self.emit('error', err);
      }
      else {
        self.emit('data', data);
      }
    });
  });
}

