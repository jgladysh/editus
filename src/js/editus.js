"use strict";

import {makeEditable, getId} from './main';
import {initStack} from './undo_redo';

var id = 'content';

window.onload = function(){
    initStack(id);
    makeEditable(id);
};