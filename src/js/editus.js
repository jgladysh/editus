"use strict";

import 'jquery';
import {getCursorCoordinates,setCaretCharIndex,getCharacterOffsetWithin} from './caret';
import{Highlighting} from './highlighting';
import{Suggestion} from './suggestion';
import {UndoRedo} from './undo_redo';


function Editus(id) {
    this.UndoRedo = new UndoRedo();
    this.highlights = [];
    this.meta = false;
    this.content = function () {
        return document.getElementById(id);
    };
    this.popoverContainerId = undefined;
    this.popoverId = undefined;

    var ed = this;

    // Add words to be highlighted
    Editus.prototype.setHighlightingWords = function (arr, className) {
        if (!arr || arr.constructor !== Array) {
            throw 'Array of highlighted words should be provided';
        }
        if (!className || className.constructor !== String) {
            throw 'Class name for highlighted words in String format should be provided';
        }
        ed.highlights.push(new Highlighting(arr, className));
        if (this.Suggestion) {
            addPopoverEvent();
        }
    };

    //Setting of service url presume actual suggestions from server side
    Editus.prototype.setSuggestionsService = function (url) {
        if (!url) {
            throw 'url to backend suggestion service should be provided';
        }
        ed.popoverContainerId = 'popoverContainer' + '_' + id;
        ed.popoverId = 'popover' + '_' + id;

        this.Suggestion = new Suggestion(url, ed.popoverId, ed.popoverContainerId, ed.content());
        if (ed.highlights.length > 0) {
            addPopoverEvent();
        }
    };

    function addPopoverEvent() {
        document.getElementById(ed.popoverContainerId).onmouseup = function () {
            var selection = window.getSelection();
            ed.highlights.forEach(function (item) {
                item.checkHighlighted(ed.content(), selection);
            });
            ed.UndoRedo.execute(0, ed.content());
        };
    }

    //Executing on key down event
    function processKeyDown(e) {
        var d = new $.Deferred();

        //Handling events at suggestion popover
        if (ed.Suggestion) {
            if (ed.Suggestion.popUp) {
                ed.Suggestion.triggerKeyDown(ed.content(), e);
            }
            //Showing of popup with suggestions at current cursor position
            if (e.ctrlKey && e.keyCode === 32) {
                e.preventDefault();
                var position = getCursorCoordinates();
                ed.Suggestion.initialisePopover(position.top + 25, position.left, ed.content());
            }
        }
        //Handling of undo/redo events
        if (e.metaKey && e.keyCode !== 65 && e.keyCode !== 88 && e.keyCode !== 86 && e.keyCode !== 67) {
            e.preventDefault();
            ed.meta = true;

            if (e.metaKey && e.keyCode === 90 && ed.UndoRedo.canUndo) {
                ed.UndoRedo.stack.undo();
            }
            else if (e.metaKey && e.keyCode === 89 && ed.UndoRedo.canRedo) {
                ed.UndoRedo.stack.redo();
            }
        }
        else {
            ed.meta = false;
        }
        return d.promise();
    }

    //Executing on key up event
    function processKeyUp(e) {
        //Return if text was selected
        if (window.getSelection().type === "Range") {
            return;
        }
        process(e);
    }

    //Check text for words to highlight and set caret to current position
    function process(e) {
        var d = new $.Deferred();
        var selection = window.getSelection(),
            range = selection.getRangeAt(0),
            offset = selection.baseOffset,
            char = getCharacterOffsetWithin(range, ed.content());

        //Handling arrow buttons events
        if (ed.highlights.length > 0 && e.keyCode !== 37 && e.keyCode !== 38 && e.keyCode !== 39 && e.keyCode !== 40) {
            ed.highlights.forEach(function (item) {
                item.checkHighlighted(ed.content(), selection);
            });
        }

        if (ed.content.firstChild !== null) {
            //Return if text was selected
            if (selection.type === "Range") {
                return d.resolve();
            }
            if (ed.highlights.length > 0) {
                ed.highlights.forEach(function (item) {
                    item.checkEveryTag(ed.content(), selection);
                    selection.removeAllRanges();
                    selection.addRange(range);
                });
            }
            //Don't manually set caret in case of moving to new line
            if (ed.meta || (!ed.meta && offset === 0)) {
                return d.promise();
            }
            else {
                setCaretCharIndex(ed.content(), char);
            }
        }
        return d.promise();
    }

    function executeStack(time, event) {
        var newLine = event.keyCode === 13;
        if (!ed.meta && !newLine) {
            ed.UndoRedo.execute(time, ed.content());
        }
    }

    //Add events to contentEditable node
    function addEvents() {
        ed.content().onkeyup = function (event) {
            processKeyUp(event);
        };
        ed.content().onkeydown = function (event) {
            processKeyDown(event).then(executeStack(250, event));
        };
        ed.content().onmouseup = function (event) {
            ed.meta = false;
            process(event).then(executeStack(0, event));
        };
    }

    //Make editor from contentEditable node
    (function makeEditable() {

        if (ed.content().nodeName !== 'DIV') {
            throw 'Editable element must be DIV';
        }
        ed.UndoRedo.initStack(ed.content());
        addEvents();

    })();

}

var initEditus = function (id) {
    return new Editus(id);
};

window.initEditus = initEditus;

export {initEditus};