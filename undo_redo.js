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
    stack.changed = function () {
        stackUI();
    };
});

var execute = function (timeout, e) {
    if (meta) {
        return;
    }
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

        if (undoPosition == redoPosition || e.keyCode == 13) {
            wasUndo = false;
            return;
        }
        if (wasUndo) {
            undoPosition = stack.stackPosition >= 0 ? stack.commands[stack.stackPosition].redoPosition : stack.commands[0].redoPosition;
        }
        else if (undoPosition != redoPosition && newValue == startValue) {
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
    }, timeout);
};