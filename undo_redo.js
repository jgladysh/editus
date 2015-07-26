/**
 * Created by julia on 7/20/15.
 */

var startValue,
    EditCommand,
    timer,
    canRedo,
    canUndo,
    wasUndo,
    position = 0,
    cursorChange = false,
    stack = new Undo.Stack();

$(document).ready(function () {
    startValue = content.innerHTML;

    //Configuring of stack commands for undo/redo events
    EditCommand = Undo.Command.extend({
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
            startValue = content.innerHTML;
            setCaretCharIndex(content, this.undoPosition);
            wasUndo = true;
        },

        redo: function () {
            this.textarea.innerHTML = this.newValue;
            startValue = content.innerHTML;
            setCaretCharIndex(content, this.redoPosition);
        }
    });

    function stackUI() {
        canRedo = stack.canRedo();
        canUndo = stack.canUndo();
    }

    stackUI();
    //Triggering changes at stack
    stack.changed = function () {
        stackUI();
    };
});

//Executing at changes in editor with timeout and save changes to stack
//On key down event timeout is 250 ms for optimizing undo/redo algorithm. On mouse event timeout is 0 ms.
var execute = function (timeout, e) {
    //Don't catch ctrl/cmd+z, ctrl/cmd+y events
    if (meta) {
        return;
    }
    //Don't set 250 ms timeout if it's first phrase in editor, or if it first change after undo event,
    //because we need to catch it exactly from beginning
    if (wasUndo || !content.hasChildNodes()) {
        timeout = 0;
    }
    clearTimeout(timer);

    timer = setTimeout(function () {
        var range = window.getSelection().getRangeAt(0),
            doNotExecute = false,
            newValue = content.innerHTML,
            undoPosition = position,
            redoPosition = getCharacterOffsetWithin(range, content);
        //Handle and don't save if nothing was changed or was 'new line' event
        if (undoPosition == redoPosition || (!executeOnInsert && e.keyCode == 13)) {
            wasUndo = false;
            return;
        }
        //Save new caret position if start typing after undo event
        if (wasUndo) {
            undoPosition = stack.stackPosition >= 0 ? stack.commands[stack.stackPosition].redoPosition : stack.commands[0].redoPosition;
        }
        //Catch mouse clicking and arrow keys events
        else if (undoPosition != redoPosition && newValue == startValue) {
            //Save only last one from series
            if (cursorChange) {
                stack.commands[stack.commands.length - 1].redoPosition = redoPosition;
                doNotExecute = true;
            }
            else {
                cursorChange = true;
            }
        }
        else {
            cursorChange = false;
        }
        if (!doNotExecute) {
            stack.execute(new EditCommand(content, startValue, newValue, undoPosition, redoPosition));
        }
        startValue = newValue;
        position = redoPosition;
        wasUndo = false;
        executeOnInsert = false;
    }, timeout);
};