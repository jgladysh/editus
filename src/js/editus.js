"use strict";

import {makeEditable} from './main';
import {initStack} from './undo_redo';

(function () {
    var Editus = {
        version: '0.0.1'
    };
    Editus.createEditor = function (id) {
        initStack(id);
        makeEditable(id);
    };

    // export as AMD module, node module, browser variable
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return Editus;
        });
    }
    else {
        module.exports = Editus;
        window.Editus = Editus;
    }
})();