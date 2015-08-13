(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.editus = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
"use strict";

var makeEditable = _dereq_("./main").makeEditable;

var initStack = _dereq_("./undo_redo").initStack;

createEditor = function (id) {
    initStack(id);
    makeEditable(id);
};

exports.createEditor = createEditor;

},{"./main":4,"./undo_redo":6}],2:[function(_dereq_,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Created by julia on 7/20/15.
 */

"use strict";

(typeof window !== "undefined" ? window['jquery'] : typeof global !== "undefined" ? global['jquery'] : null);

//Get index of character after which the cursor is positioned
function getCharacterOffsetWithin(range, node) {
    var treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, function (node) {
        var nodeRange = document.createRange();
        nodeRange.selectNode(node);
        return nodeRange.compareBoundaryPoints(Range.END_TO_END, range) < 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }, false);

    var charCount = 0;
    while (treeWalker.nextNode()) {
        charCount += treeWalker.currentNode.length;
    }
    if (range.startContainer.nodeType === 3) {
        charCount += range.startOffset;
    }
    return charCount;
}

//Set the cursor after specified character
function setCaretCharIndex(containerEl, index) {
    var charIndex = 0,
        stop = {};

    function traverseNodes(node) {
        if (node.nodeType === 3) {
            var nextCharIndex = charIndex + node.length;
            if (index >= charIndex && index <= nextCharIndex) {
                window.getSelection().collapse(node, index - charIndex);
                throw stop;
            }
            charIndex = nextCharIndex;
        } else {
            var child = node.firstChild;
            while (child) {
                traverseNodes(child);
                child = child.nextSibling;
            }
        }
    }

    try {
        traverseNodes(containerEl);
    } catch (ex) {
        if (ex !== stop) {
            throw ex;
        }
    }
}

//Get the cursor coordinates position inside editor
//At contentEditable element for this needed to create temporary span element at caret position, get it coordinates and then remove it
function getCursorCoordinates() {
    var range = window.getSelection().getRangeAt(0);
    var anchor = document.createElement("span");
    anchor.className = "anchor";
    range.insertNode(anchor);
    var position = $(".anchor").offset();
    anchor.parentNode.removeChild($(".anchor")[0]);
    return position;
}

exports.getCursorCoordinates = getCursorCoordinates;
exports.setCaretCharIndex = setCaretCharIndex;
exports.getCharacterOffsetWithin = getCharacterOffsetWithin;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(_dereq_,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Created by julia on 7/20/15.
 */
"use strict";

var setProcessing = _dereq_("./main").setProcessing;

var _caret = _dereq_("./caret");

var setCaretCharIndex = _caret.setCaretCharIndex;
var getCharacterOffsetWithin = _caret.getCharacterOffsetWithin;

(typeof window !== "undefined" ? window['jquery'] : typeof global !== "undefined" ? global['jquery'] : null);

//Array of words, that should be highlighted
var keyWordsArray = ["create", "experiment", "assign", "to", "all", "users", "where", "for", "salt", "new"];

//Recursively check every element in contentEditable node
function checkEveryTag(node) {
    if (node.childNodes.length > 0) {
        for (var i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].data && node.childNodes[i].data !== "" || node.childNodes[i].nodeName === "DIV") {
                checkEveryTag(node.childNodes[i]);
            }
        }
    } else {
        var ranges = makeRangesFromMatches(keyWordsArray, node);
        wrapNodes(ranges);
    }
}

//Find occurrences of word in text, and return array of indexes of each matched word inside text
function getMatches(word, text) {
    var regular = new RegExp("\\b" + word + "\\b((?!\\W(?=\\w))|(?=\\s))", "gi"),
        array,
        result = [];
    while ((array = regular.exec(text)) !== null) {
        result.push(array.index);
    }
    return result;
}

//Make range from each matched word, return array of created ranges
function makeRangesFromMatches(arr, node) {
    var ranges = [];

    for (var j = 0; j < arr.length; j++) {
        var word = arr[j],
            matches = getMatches(word, node.nodeValue);
        if (matches.length > 0) {
            var matchArray = [];
            for (var l = 0; l < matches.length; l++) {
                var rng = document.createRange();
                rng.setStart(node, matches[l]);
                rng.setEnd(node, matches[l] + word.length);
                matchArray[l] = rng;
            }
            ranges = ranges.concat(matchArray);
        }
    }
    return ranges;
}

//Wrap every range element from ranges array with 'highlighted' span tag
function wrapNodes(ranges) {
    for (var i = 0; i < ranges.length; i++) {
        var highlightTag = document.createElement("span");
        highlightTag.className = "highlighted";
        $(highlightTag).data("content", ranges[i].toString());
        ranges[i].surroundContents(highlightTag);
    }
}

//Check every highlighted node for changes
function checkHighlighted(e, id) {
    var sel = window.getSelection(),
        anchorNode = sel.anchorNode,
        nextNode = anchorNode.nextElementSibling,
        content = document.getElementById(id),
        nodeToCheck = sel.baseNode.parentElement;
    //Handle caret positioning just before highlighted node, that prevent sticking of regular text nodes with highlighted
    if (anchorNode.length === sel.anchorOffset && (nextNode && nextNode.nodeName === "SPAN")) {
        $(nextNode).contents().unwrap();
        content.normalize();
        setProcessing(true);
    }
    if (nodeToCheck.className === "highlighted" || sel.baseNode.className === "highlighted") {
        var range = sel.getRangeAt(0),
            char = getCharacterOffsetWithin(range, content),
            highlighted = $(".highlighted");
        for (var i = 0; i < highlighted.length; i++) {
            var text = $(highlighted[i]).text();
            if (!new RegExp(keyWordsArray.map(function (w) {
                return "^" + w + "$";
            }).join("|"), "gi").test(text)) {
                $(highlighted[i]).contents().unwrap();
                content.normalize();
                if (e.keyCode !== 13) {
                    setCaretCharIndex(content, char);
                }
            }
        }
    }
}

exports.checkHighlighted = checkHighlighted;
exports.checkEveryTag = checkEveryTag;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./caret":2,"./main":4}],4:[function(_dereq_,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Created by julia on 6/22/15.
 */
"use strict";

(typeof window !== "undefined" ? window['jquery'] : typeof global !== "undefined" ? global['jquery'] : null);

var _caret = _dereq_("./caret");

var getCursorCoordinates = _caret.getCursorCoordinates;
var setCaretCharIndex = _caret.setCaretCharIndex;
var getCharacterOffsetWithin = _caret.getCharacterOffsetWithin;

var _highlighting = _dereq_("./highlighting");

var checkHighlighted = _highlighting.checkHighlighted;
var checkEveryTag = _highlighting.checkEveryTag;

var _suggestion = _dereq_("./suggestion");

var getPopUp = _suggestion.getPopUp;
var initialisePopover = _suggestion.initialisePopover;
var listScroll = _suggestion.listScroll;
var destroyPopUp = _suggestion.destroyPopUp;

var _undo_redo = _dereq_("./undo_redo");

var stack = _undo_redo.stack;
var getCanRedo = _undo_redo.getCanRedo;
var getCanUndo = _undo_redo.getCanUndo;
var execute = _undo_redo.execute;
var setMeta = _undo_redo.setMeta;
var getMeta = _undo_redo.getMeta;

var processing = false,
    id,
    content,
    popoverString = "<div class='popoverContainer' style='position: absolute;'><a href=\"#\" title=\"\" data-toggle=\"popover\" data-content=\"\" data-placement=\"bottom\"></a> </div>";

//Executing on key down event
function processKeyDown(e) {
    var d = new $.Deferred();
    //Handling events at suggestion popover
    if (getPopUp() && (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13)) {
        e.preventDefault();
        listScroll(e);
        return d.reject();
    } else if (getPopUp()) {
        destroyPopUp();
    }
    //Showing of popup with suggestions at current cursor position
    if (e.shiftKey && e.keyCode === 32) {
        e.preventDefault();
        var position = getCursorCoordinates();
        initialisePopover(position.top + 25, position.left, id);
        return d.reject();
    }
    //Handling of undo/redo events
    if (e.metaKey && e.keyCode !== 65 && e.keyCode !== 88 && e.keyCode !== 86 && e.keyCode !== 67) {
        e.preventDefault();
        setMeta(true);

        if (e.metaKey && e.keyCode === 90 && getCanUndo()) {
            stack.undo();
        } else if (e.metaKey && e.keyCode === 89 && getCanRedo()) {
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
        checkHighlighted(e, id);
    } else {
        processing = true;
    }

    if (processing) {
        process(content);
    }
}

//Check text for words to highlight and set caret to current position
function process(content) {
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
        if (getMeta() && offset === 0 && selection.baseNode.nodeName === "DIV" || !getMeta() && offset === 0) {
            return d.promise();
        } else {
            setCaretCharIndex(content, char);
        }
    }
    return d.promise();
}

//Set boolean processing value
function setProcessing(val) {
    processing = val;
}

//Make editor from contentEditable node
function makeEditable(contentId) {
    id = contentId;
    content = document.getElementById(id);

    if (content.nodeName !== "DIV") {
        throw "Editable element must be DIV";
    }
    $(content).after(popoverString);
    addEvents(content);
}

//Add events to contentEditable node
function addEvents(content) {
    content.onkeyup = function (event) {
        processKeyUp(event);
    };
    content.onkeydown = function (event) {
        processKeyDown(event).then(execute(250, event), function () {});
    };
    content.onmouseup = function () {
        process(content).then(execute(0, event), function () {});
    };
}

exports.setProcessing = setProcessing;
exports.processKeyDown = processKeyDown;
exports.processKeyUp = processKeyUp;
exports.process = process;
exports.makeEditable = makeEditable;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./caret":2,"./highlighting":3,"./suggestion":5,"./undo_redo":6}],5:[function(_dereq_,module,exports){
(function (global){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Created by julia on 7/20/15.
 */
"use strict";

var _undo_redo = _dereq_("./undo_redo");

var execute = _undo_redo.execute;

var _caret = _dereq_("./caret");

var setCaretCharIndex = _caret.setCaretCharIndex;
var getCharacterOffsetWithin = _caret.getCharacterOffsetWithin;

var checkHighlighted = _dereq_("./highlighting").checkHighlighted;

var setExecuteOnInsert = _undo_redo.setExecuteOnInsert;

(typeof window !== "undefined" ? window['jquery'] : typeof global !== "undefined" ? global['jquery'] : null);

var jQuery = _interopRequire((typeof window !== "undefined" ? window['jquery'] : typeof global !== "undefined" ? global['jquery'] : null));

(typeof window !== "undefined" ? window['bootstrap'] : typeof global !== "undefined" ? global['bootstrap'] : null);

var popoverContainer,
    pop,
    id,
    popUp = false,
    chosen,
    $current,
    suggestions = $.parseHTML("<div class=\"list-group\"><a href=\"#\" class=\"list-group-item\">Item 1</a><a href=\"#\" class=\"list-group-item\">Item 2</a> <a href=\"#\" class=\"list-group-item\">Item 3</a> <a href=\"#\" class=\"list-group-item\">Item 4</a> <a href=\"#\" class=\"list-group-item\">Item 5</a> </div>")[0];

//Popover initialisation
function initialisePopover(top, left, contentId) {
    id = contentId;
    popoverContainer = $(".popoverContainer")[0];
    pop = $("[data-toggle=\"popover\"]");
    chosen = undefined;
    $current = undefined;
    pop.popover({ html: true, content: suggestions });
    popoverContainer.style.top = top + "px";
    popoverContainer.style.left = left + "px";

    pop.popover("show");
    popUp = true;
    //Destroy popover when user takes away mouse from it
    $(".popover").mouseleave(function () {
        destroyPopUp();
        popUp = false;
    });
    //Triggering of choosing popup item with mouse
    $(".popover").on("mousedown", "a", function (e) {
        e.preventDefault();
        chosen = e.currentTarget.innerText;
        destroyPopUp();
        popUp = false;
        insertNodeAtCursor(document.createTextNode(chosen));
        checkHighlighted(e, id);
        execute(0, e);
    });
}

//Handling Up/Down/Enter buttons in popover
function listScroll(e) {
    var key = e.keyCode,
        $listItems = $(".list-group-item"),
        $selected = $listItems.filter(".selected");

    $listItems.removeClass("selected");
    //Handling Enter button
    if (key === 13 && $current) {
        chosen = $($current[0]).html();
        destroyPopUp();
        popUp = false;
        insertNodeAtCursor(document.createTextNode(chosen));
        return;
    }
    //Handling Down button
    if (key === 40) {
        if (!$selected.length || $selected.is(":last-child")) {
            $current = $listItems.eq(0);
        } else {
            $current = $selected.next();
        }
    }
    //Handling Up button
    else if (key === 38) {
        if (!$selected.length || $selected.is(":first-child")) {
            $current = $listItems.last();
        } else {
            $current = $selected.prev();
        }
    }
    $current.addClass("selected");
}

//Insert node at current cursor position
function insertNodeAtCursor(node) {
    var content = document.getElementById(id);
    var range = window.getSelection().getRangeAt(0);
    var char = getCharacterOffsetWithin(range, content);
    range.insertNode(node);
    content.normalize();
    setCaretCharIndex(content, char + node.length);
    setExecuteOnInsert(true);
}

//Return boolean value (true, if popover displayed)
function getPopUp() {
    return popUp;
}

//Destroy popover
function destroyPopUp() {
    pop.popover("destroy");
}

exports.getPopUp = getPopUp;
exports.initialisePopover = initialisePopover;
exports.listScroll = listScroll;
exports.destroyPopUp = destroyPopUp;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./caret":2,"./highlighting":3,"./undo_redo":6}],6:[function(_dereq_,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Created by julia on 7/20/15.
 */

"use strict";

var _caret = _dereq_("./caret");

var setCaretCharIndex = _caret.setCaretCharIndex;
var getCharacterOffsetWithin = _caret.getCharacterOffsetWithin;

(typeof window !== "undefined" ? window['jquery'] : typeof global !== "undefined" ? global['jquery'] : null);

(typeof window !== "undefined" ? window['undo'] : typeof global !== "undefined" ? global['undo'] : null);

var startValue,
    EditCommand,
    timer,
    canRedo,
    canUndo,
    wasUndo,
    content,
    position = 0,
    executeOnInsert = false,
    cursorChange = false,
    meta = false,
    stack = new Undo.Stack();

//Configuring of stack commands for undo/redo events
function initStack(id) {
    content = document.getElementById(id);
    startValue = content.innerHTML;

    EditCommand = Undo.Command.extend({
        constructor: function constructor(textarea, oldValue, newValue, undoPosition, redoPosition) {
            this.textarea = textarea;
            this.oldValue = oldValue;
            this.newValue = newValue;
            this.undoPosition = undoPosition;
            this.redoPosition = redoPosition;
        },
        execute: function execute() {},
        undo: function undo() {
            this.textarea.innerHTML = this.oldValue;
            startValue = content.innerHTML;
            setCaretCharIndex(content, this.undoPosition);
            wasUndo = true;
        },

        redo: function redo() {
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
}

//Executing at changes in editor with timeout and save changes to stack
//On key down event timeout is 250 ms for optimizing undo/redo algorithm. On mouse event timeout is 0 ms.
var execute = function execute(timeout, e) {
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
        if (undoPosition === redoPosition || !executeOnInsert && e.keyCode === 13) {
            wasUndo = false;
            return;
        }
        //Save new caret position if start typing after undo event
        if (wasUndo) {
            undoPosition = stack.stackPosition >= 0 ? stack.commands[stack.stackPosition].redoPosition : stack.commands[0].redoPosition;
        }
        //Catch mouse clicking and arrow keys events
        else if (undoPosition !== redoPosition && newValue === startValue) {
            //Save only last one from series
            if (cursorChange) {
                stack.commands[stack.commands.length - 1].redoPosition = redoPosition;
                doNotExecute = true;
            } else {
                cursorChange = true;
            }
        } else {
            cursorChange = false;
        }
        if (!doNotExecute) {
            stack.execute(new EditCommand(content, startValue, newValue, undoPosition, redoPosition));
        }
        startValue = newValue;
        position = redoPosition;
        wasUndo = false;
        setExecuteOnInsert(false);
    }, timeout);
};

//Return boolean canRedo value (true if redo event is possible)
function getCanRedo() {
    return canRedo;
}

//Return boolean canUndo value (true if undo event is possible)
function getCanUndo() {
    return canUndo;
}

//Set meta value
function setMeta(val) {
    meta = val;
}

//Return boolean meta value (true if meta key was pressed)
function getMeta() {
    return meta;
}

//Set executeOnInsert value
function setExecuteOnInsert(val) {
    executeOnInsert = val;
}

exports.execute = execute;
exports.getCanRedo = getCanRedo;
exports.getCanUndo = getCanUndo;
exports.stack = stack;
exports.setMeta = setMeta;
exports.getMeta = getMeta;
exports.setExecuteOnInsert = setExecuteOnInsert;
exports.initStack = initStack;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./caret":2}]},{},[1])(1)
});