/**
 * Created by julia on 7/20/15.
 */

"use strict";

import 'jquery';
import 'undo';

export function UndoRedo() {

    this.EditCommand = undefined;
    this.stack = undefined;
    this.startValue = undefined;
    this.timer = 0;
    this.canRedo = false;
    this.canUndo = false;
    this.wasUndo = false;
    this.position = 0;
    this.cursorChange = false;

    var ur = this;
//Configuring of stack commands for undo/redo events
    this.initStack = function (content) {
        this.stack = new Undo.Stack();
        this.startValue = content.innerHTML;

        function setCaretRange(position) {
            var range = document.createRange();
            var selection = window.getSelection();
            var node = content.childNodes[position.nodeIndex];
            if (!(node instanceof Node)) {
                return;
            }
            range.setStart(node, position.offset);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        this.EditCommand = Undo.Command.extend({
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
                ur.startValue = content.innerHTML;
                ur.wasUndo = true;
                setCaretRange(this.undoPosition);
            },

            redo: function () {
                this.textarea.innerHTML = this.newValue;
                ur.startValue = content.innerHTML;
                if (this.redoPosition.nodeIndex !== undefined) {
                    setCaretRange(this.redoPosition);
                }
            }
        });

        function stackUI() {
            ur.canRedo = ur.stack.canRedo();
            ur.canUndo = ur.stack.canUndo();
        }

        stackUI();
        //Triggering changes at stack
        ur.stack.changed = function () {
            stackUI();
        };
    };

//Executing at changes in editor with timeout and save changes to stack
//On key down event timeout is 250 ms for optimizing undo/redo algorithm. On mouse event timeout is 0 ms.
    this.execute = function (timeout, e, content) {
        //Don't set 250 ms timeout if it's first phrase in editor, or if it first change after undo event,
        //because we need to catch it exactly from beginning
        if (this.wasUndo || !content.hasChildNodes()) {
            timeout = 0;
        }
        clearTimeout(this.timer);

        this.timer = setTimeout(function () {
            var range = window.getSelection().getRangeAt(0),
                doNotExecute = false,
                newValue = content.innerHTML,
                undoPosition = ur.position,
                redoPosition = {
                    nodeIndex: findNodeIndex(content.id, range.startContainer),
                    offset: range.startOffset
                };
            //Handle and don't save if nothing was changed or was 'new line' event
            if (undoPosition === redoPosition || e.keyCode === 13) {
                ur.wasUndo = false;
                return;
            }
            //Save new caret position if start typing after undo event
            if (ur.wasUndo) {
                undoPosition = ur.stack.stackPosition >= 0 ? ur.stack.commands[ur.stack.stackPosition].redoPosition : ur.stack.commands[0].redoPosition;
            }
            //Catch mouse clicking and arrow keys events
            else if (undoPosition !== redoPosition && newValue === ur.startValue) {
                //Save only last one from series
                if (ur.cursorChange) {
                    ur.stack.commands[ur.stack.commands.length - 1].redoPosition = redoPosition;
                    doNotExecute = true;
                }
                else {
                    ur.cursorChange = true;
                }
            }
            else {
                ur.cursorChange = false;
            }
            if (!doNotExecute) {
                ur.stack.execute(new ur.EditCommand(content, ur.startValue, newValue, undoPosition, redoPosition));
            }
            ur.startValue = newValue;
            ur.position = redoPosition;
            ur.wasUndo = false;
        }, timeout);
    };

    //Find index of node in editor
    function findNodeIndex(id, node) {
        if (node.id === id) {
            return 0;
        }
        var parent;
        while (node.parentNode.nodeName !== 'DIV') {
            node = parent = node.parentNode;
        }
        var i = 0;
        while (node = node.previousSibling) {
            ++i;
        }
        return i;
    }
}

