var requireDir = require('require-dir');

//Forwarding to the folder with tasks and configs
requireDir('./gulp/tasks', { recurse: true });