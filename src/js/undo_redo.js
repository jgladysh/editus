/**
 * Created by julia on 7/20/15.
 */

"use strict";

import {setCaretCharIndex,getCharacterOffsetWithin} from './caret';
import 'jquery';
import 'undo';

//Configuring of stack commands for undo/redo events
function initStack(obj) {
    var content = obj.content();
    obj.stack = new Undo.Stack();

    obj.EditCommand = Undo.Command.extend({
        constructor: function (textarea, oldValue, newValue, undoPosition, redoPosition) {
            this.textarea = textarea;
            this.oldValue = oldValue;
            this.newValue = newValue;
            this.undoPosition = undoPosition;
            this.redoPosition = redoPosition;

        },
        execute: function () {
        },
        undo: function () {
            this.textarea.innerHTML = this.oldValue;
            obj.startValue = content.innerHTML;
            setCaretCharIndex(content, this.undoPosition);
            obj.wasUndo = true;
        },

        redo: function () {
            this.textarea.innerHTML = this.newValue;
            obj.startValue = content.innerHTML;
            setCaretCharIndex(content, this.redoPosition);
        }
    });

    function stackUI() {
        obj.canRedo = obj.stack.canRedo();
        obj.canUndo = obj.stack.canUndo();
    }

    stackUI();
    //Triggering changes at stack
    obj.stack.changed = function () {
        stackUI();
    };
}

//Executing at changes in editor with timeout and save changes to stack
//On key down event timeout is 250 ms for optimizing undo/redo algorithm. On mouse event timeout is 0 ms.
var execute = function (timeout, e, obj) {
    var content = obj.content();
    //Don't catch ctrl/cmd+z, ctrl/cmd+y events
    if (obj.meta) {
        return;
    }
    //Don't set 250 ms timeout if it's first phrase in editor, or if it first change after undo event,
    //because we need to catch it exactly from beginning
    if (obj.wasUndo || !content.hasChildNodes()) {
        timeout = 0;
    }
    clearTimeout(obj.timer);

    obj.timer = setTimeout(function () {
        var range = window.getSelection().getRangeAt(0),
            doNotExecute = false,
            newValue = content.innerHTML,
            undoPosition = obj.position,
            redoPosition = getCharacterOffsetWithin(range, content);
        //Handle and don't save if nothing was changed or was 'new line' event
        if (undoPosition === redoPosition || (!obj.executeOnInsert && e.keyCode === 13)) {
            obj.wasUndo = false;
            return;
        }
        //Save new caret position if start typing after undo event
        if (obj.wasUndo) {
            undoPosition = obj.stack.stackPosition >= 0 ? obj.stack.commands[obj.stack.stackPosition].redoPosition : obj.stack.commands[0].redoPosition;
        }
        //Catch mouse clicking and arrow keys events
        else if (undoPosition !== redoPosition && newValue === obj.startValue) {
            //Save only last one from series
            if (obj.cursorChange) {
                obj.stack.commands[obj.stack.commands.length - 1].redoPosition = redoPosition;
                doNotExecute = true;
            }
            else {
                obj.cursorChange = true;
            }
        }
        else {
            obj.cursorChange = false;
        }
        if (!doNotExecute) {
            obj.stack.execute(new obj.EditCommand(content, obj.startValue, newValue, undoPosition, redoPosition));
        }
        obj.startValue = newValue;
        obj.position = redoPosition;
        obj.wasUndo = false;
        obj.executeOnInsert = false;
    }, timeout);
};

export{execute, initStack};