"use strict";

import {makeEditable} from './main';
import {initStack} from './undo_redo';
import {setKeyWordsArray} from './highlighting';

// Create editor from contentEditable div
createEditor = function (id) {
    initStack(id);
    makeEditable(id);
};

// Add words to be highlighted
setHighlightingWords = function (arr) {
    if (arr && arr.length >= 0) {
        setKeyWordsArray(arr);
    }
};

export {createEditor, setHighlightingWords};