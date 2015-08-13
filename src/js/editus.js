"use strict";

import {makeEditable} from './main';
import {initStack} from './undo_redo';

    createEditor = function (id) {
        initStack(id);
        makeEditable(id);
    };

export {createEditor};