/**
 * Created by julia on 6/22/15.
 */
"use strict";

import 'jquery';
import {getCursorCoordinates,setCaretCharIndex,getCharacterOffsetWithin} from './caret';
import{checkHighlighted,checkEveryTag} from './highlighting';
import{initialisePopover, listScroll, destroyPopUp} from './suggestion';
import {execute} from './undo_redo';

//Executing on key down event
function processKeyDown(e, id, obj) {
    var d = new $.Deferred();
    //Handling events at suggestion popover
    if (obj.popUp && (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13)) {
        e.preventDefault();
        listScroll(e, obj);
        return d.reject();
    }
    else if (obj.popUp) {
        destroyPopUp(obj);
    }
    //Showing of popup with suggestions at current cursor position
    if (e.shiftKey && e.keyCode === 32) {
        e.preventDefault();
        var position = getCursorCoordinates();
        initialisePopover(position.top + 25, position.left, id, obj);
        return d.reject();
    }
    //Handling of undo/redo events
    if (e.metaKey && e.keyCode !== 65 && e.keyCode !== 88 && e.keyCode !== 86 && e.keyCode !== 67) {
        e.preventDefault();
        obj.meta = true;

        if (e.metaKey && e.keyCode === 90 && obj.canUndo) {
            obj.stack.undo();
        }
        else if (e.metaKey && e.keyCode === 89 && obj.canRedo) {
            obj.stack.redo();
        }
    }
    return d.promise();
}

//Executing on key up event
function processKeyUp(e, content, id, obj) {
    //Return if text was selected
    if (window.getSelection().type === "Range") {
        return;
    }
    //Handling space, 'enter' and undo/redo events
    if (e.keyCode === 32 || e.keyCode === 13 || e.keyCode === 8 || obj.meta) {
        obj.meta = false;
    }
    //Handling arrow buttons events
    if (e.keyCode !== 37 && e.keyCode !== 38 && e.keyCode !== 39 && e.keyCode !== 40) {
        checkHighlighted(e, obj);
    }
    process(content, obj);
}

//Check text for words to highlight and set caret to current position
function process(content, obj) {
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

        checkEveryTag(content, obj);
        //Don't manually set caret in case of moving to new line
        if ((obj.meta && offset === 0 && selection.baseNode.nodeName === 'DIV') || (!obj.meta && offset === 0)) {
            return d.promise();
        }
        else {
            setCaretCharIndex(content, char);
        }
    }
    return d.promise();
}


//Make editor from contentEditable node
function makeEditable(contentId, obj) {

    var id = contentId;
    var content = obj.content();

    if (content.nodeName !== 'DIV') {
        throw 'Editable element must be DIV';
    }

    addSuggestionsPopover(obj);
    addEvents(content, id, obj);

}

function addSuggestionsPopover(obj) {
    var popoverString = "<div style = \'position : absolute\' class = 'popoverContainer' id='" +
        obj.popoverContainerId +
        "'><a href=\"#\" title=\"\" data-toggle=\"popover\" id='" +
        obj.popoverId +
        "'data-content=\"\" data-placement=\"bottom\"></a></div>";
    $(obj.content()).after(popoverString);
}

//Add events to contentEditable node
function addEvents(content, id, obj) {
    content.onkeyup = function (event) {
        processKeyUp(event, content, id, obj);
    };
    content.onkeydown = function (event) {
        processKeyDown(event, id, obj).then(execute(250, event, obj), function () {
        });
    };
    content.onmouseup = function () {
        process(content, obj).then(execute(0, event, obj), function () {
        });
    };
}

export {makeEditable};