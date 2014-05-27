#!/usr/bin/env node
var prettyjson = require('prettyjson');
var fs = require('fs');

var files = process.argv.splice(2);
var cache = {};

var printEvent = function(event) {
    try {
        console.log(prettyjson.render(JSON.parse(event)));
        console.log(' --- ');
    } catch (e) {
        // wasn't ldjson
    }
};

var readLastFewLines = function(file) {
    var data = fs.readFileSync(file, 'utf8');
    var lines = data.split("\n").filter(function(data) { return data !== ''; });
    printEvent(lines[lines.length-1]);
};

var printNewLines = function(file, lastSize) {
    var fd = fs.openSync(file, 'r');
    var stats = fs.statSync(file);
    var bytesToRead = stats.size - lastSize;
    if (bytesToRead == 0) {
        return;
    }
    var buf = new Buffer(bytesToRead);
    fs.readSync(fd, buf, 0, bytesToRead, lastSize);
    var events = buf.toString('utf8');
    events = events.split("\n").filter(function(data) { return data !== ''; });
    events.forEach(function(event) {
        printEvent(event);
    });
};

files.forEach(function(file) {
    var stats = fs.statSync(file);
    if (stats.isFile()) {
        cache[file] = stats.size;
        readLastFewLines(file);
    } else if (stats.isDirectory()) {
        var dir = file;
        var files = fs.readdirSync(dir);
        files.forEach(function(file) {
            console.log(file);
            var stats = fs.statSync(file);
            if (!stats.isFile()) {
                return;
            }
            cache[file] = stats.size;
            readLastFewLines(file);
        });
    }
    fs.watch(file, { persistent: true }, function(type, file) {
        console.log('watch', type, file);
        printNewLines(file, cache[file] || 0);
        var stats = fs.statSync(file);
        cache[file] = stats.size;
    });
});
