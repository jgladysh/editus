"use strict";

import {makeEditable} from './main';
import {initStack} from './undo_redo';

    var createEditor = function (id) {
        initStack(id);
        makeEditable(id);
    };

export {createEditor};