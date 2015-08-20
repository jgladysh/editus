"use strict";

import {makeEditable} from './main';
import {initStack} from './undo_redo';

function Editus(id) {
    this.editorId = id;
    this.content = function () {
        return document.getElementById(id);
    };
    this.startValue = id ? document.getElementById(id).innerHTML : undefined;
    this.EditCommand = undefined;
    this.stack = undefined;
    this.timer = 0;
    this.canRedo = false;
    this.canUndo = false;
    this.wasUndo = false;
    this.position = 0;
    this.executeOnInsert = false;
    this.cursorChange = false;
    this.meta = false;
    this.popUp = false;
    this.chosen = undefined;
    this.$current = undefined;
    this.popoverContainerId = 'popoverContainer' + '_' + id;
    this.popoverId = 'popover' + '_' + id;
    this.popoverContainer = function () {
        return document.getElementById(this.popoverContainerId);
    };
    this.popov = function () {
        return document.getElementById(this.popoverId);
    };
    this.suggestionUrl = 'http://localhost:3000/';

    initStack(this);
    makeEditable(this.editorId, this);

    // Add words to be highlighted
    this.setHighlightingWords = function (arr) {
        if (arr && arr.length >= 0) {
            this.keyWordsArray = arr;
        }
    };

}

var initEditus = function (id) {
    return new Editus(id);
};

export {initEditus};