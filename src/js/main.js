/**
 * Created by julia on 6/22/15.
 */
"use strict";

require('jquery');
import {getCursorCoordinates,setCaretCharIndex,getCharacterOffsetWithin} from './caret';
import{checkHighlighted,checkEveryTag} from './highlighting';
import{getPopUp, initialisePopover, listScroll, destroyPopUp} from './suggestion';
import {stack,getCanRedo,getCanUndo, execute, setMeta, getMeta} from './undo_redo';

var content,
    processing = false;

$(document).ready(function () {
    content = $('#content')[0];
});

//Executing on key down event
function processKeyDown(e) {
    var d = new $.Deferred();
    //Handling events at suggestion popover
    if (getPopUp() && (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13)) {
        e.preventDefault();
        listScroll(e);
        return d.reject();
    }
    else if (getPopUp()) {
        destroyPopUp();
    }
    //Showing of popup with suggestions at current cursor position
    if (e.shiftKey && e.keyCode === 32) {
        e.preventDefault();
        var position = getCursorCoordinates();
        initialisePopover(position.top + 25, position.left);
        return d.reject();
    }
    //Handling of undo/redo events
    if (e.metaKey && e.keyCode !== 65 && e.keyCode !== 88 && e.keyCode !== 86 && e.keyCode !== 67) {
        e.preventDefault();
        setMeta(true);

        if (e.metaKey && e.keyCode === 90 && getCanUndo()) {
            stack.undo();
        }
        else if (e.metaKey && e.keyCode === 89 && getCanRedo()) {
            stack.redo();
        }
    }
    return d.promise();
}

//Executing on key up event
function processKeyUp(e) {
    //Return if text was selected
    if (window.getSelection().type === "Range") {
        return;
    }
    //Handling space, 'enter' and undo/redo events
    if (e.keyCode === 32 || e.keyCode === 13 || e.keyCode === 8 || getMeta()) {
        processing = true;
        setMeta(false);
    }
    //Handling arrow buttons events
    if (e.keyCode !== 37 && e.keyCode !== 38 && e.keyCode !== 39 && e.keyCode !== 40) {
        checkHighlighted(e);
    } else {
        processing = true;
    }

    if (processing) {
        process();
    }
}

//Check text for words to highlight and set caret to current position
function process() {
    var d = new $.Deferred();

    if (content.firstChild !== null) {
        var selection = window.getSelection(),
            range = selection.getRangeAt(0),
            char = getCharacterOffsetWithin(range, content),
            offset = selection.baseOffset;
        //Return if text was selected
        if (selection.type === "Range") {
            return d.resolve();
        }

        checkEveryTag(content);
        //Don't manually set caret in case of moving to new line
        if ((getMeta() && offset === 0 && selection.baseNode.nodeName === 'DIV') || (!getMeta() && offset === 0)) {
            return d.promise();
        }
        else {
            setCaretCharIndex(content, char);
        }
    }
    return d.promise();
}

//Set boolean processing value
function setProcessing(val){
    processing = val;
}

//Make editor from contentEditable node
function makeEditable(id) {
    var content = document.getElementById(id);
    content.onkeyup = function (event) {
        processKeyUp(event);
    };
    content.onkeydown = function (event) {
        processKeyDown(event).then(execute(250, event), function () {
        });
    };
    content.onmouseup = function () {
        process().then(execute(0, event), function () {
        });
    };

}
export {setProcessing, processKeyDown, processKeyUp, process, makeEditable};