"use strict";

import 'jquery';
import {getCursorCoordinates,setCaretCharIndex,getCharacterOffsetWithin} from './caret';
import{Highlighting} from './highlighting';
import{Suggestion} from './suggestion';
import {UndoRedo} from './undo_redo';


function Editus(id) {
    this.UndoRedo = new UndoRedo();
    this.editorId = id;
    this.executeOnInsert = false;
    this.meta = false;
    this.content = function () {
        return document.getElementById(id);
    };
    this.popoverContainerId = undefined;
    this.popoverId = undefined;
    var ed = this;

    // Add words to be highlighted
    this.setHighlightingWords = function (arr) {
        if (arr && arr.length >= 0) {
            this.Highlighting = new Highlighting(arr);
            if (this.Suggestion) {
                addPopoverEvent()
            }
        }
    };

    //Setting of service url presume actual suggestions from server side
    this.setSuggestionsService = function (url) {
        if (url) {
            this.popoverContainerId = 'popoverContainer' + '_' + id;
            this.popoverId = 'popover' + '_' + id;

            this.Suggestion = new Suggestion(url, this.popoverId, this.popoverContainerId, this.content());
            if (this.Highlighting) {
                addPopoverEvent()
            }
        }
    };

    function addPopoverEvent() {
        document.getElementById(ed.popoverContainerId).onmouseup = function (event) {
            ed.Highlighting.checkHighlighted(event, ed.content());
            ed.UndoRedo.execute(0, event, ed);
        }
    }

//Executing on key down event
    this.content().processKeyDown = function (e) {
        var d = new $.Deferred();
        //Handling events at suggestion popover
        if (ed.Suggestion.popUp) {
            ed.Suggestion.triggerKeyDown(ed.content(), e)
        }
        //Showing of popup with suggestions at current cursor position
        if (e.ctrlKey && e.keyCode === 32) {
            if (ed.Suggestion) {
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
        return d.promise();
    };

//Executing on key up event
    this.content().processKeyUp = function (e) {
        //Return if text was selected
        if (window.getSelection().type === "Range") {
            return;
        }
        //Handling space, 'enter' and undo/redo events
        if (e.keyCode === 32 || e.keyCode === 13 || e.keyCode === 8 || ed.meta) {
            ed.meta = false;
        }

        this.process(e);
    };

//Check text for words to highlight and set caret to current position
    this.content().process = function (e) {
        var d = new $.Deferred();

        //Handling arrow buttons events
        if (ed.Highlighting && e.keyCode !== 37 && e.keyCode !== 38 && e.keyCode !== 39 && e.keyCode !== 40) {
            ed.Highlighting.checkHighlighted(e, ed.content());
        }

        if (ed.content.firstChild !== null) {
            var selection = window.getSelection(),
                range = selection.getRangeAt(0),
                char = getCharacterOffsetWithin(range, ed.content()),
                offset = selection.baseOffset;
            //Return if text was selected
            if (selection.type === "Range") {
                return d.resolve();
            }
            if (ed.Highlighting) {
                ed.Highlighting.checkEveryTag(ed.content());
            }
            //Don't manually set caret in case of moving to new line
            if ((ed.meta && offset === 0 && selection.baseNode.nodeName === 'DIV') || (!ed.meta && offset === 0)) {
                return d.promise();
            }
            else {
                setCaretCharIndex(ed.content(), char);
            }
        }
        return d.promise();
    };


//Make editor from contentEditable node
    this.makeEditable = function () {

        if (this.content().nodeName !== 'DIV') {
            throw 'Editable element must be DIV';
        }
        this.addEvents();

    };

//Add events to contentEditable node
    this.addEvents = function () {
        this.content().onkeyup = function (event) {
            this.processKeyUp(event);
        };
        this.content().onkeydown = function (event) {
            this.processKeyDown(event).then(ed.UndoRedo.execute(250, event, ed), function () {
            });
        };
        this.content().onmouseup = function (event) {
            this.process(event).then(ed.UndoRedo.execute(0, event, ed), function () {
            });
        };
    };

    this.UndoRedo.initStack(this);
    this.makeEditable(this.editorId, this);

}

var initEditus = function (id) {
    return new Editus(id);
};

window.initEditus = initEditus;

export {initEditus};