(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.editus = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
"use strict";

var makeEditable = _dereq_("./main").makeEditable;

var initStack = _dereq_("./undo_redo").initStack;

function Editus(id) {
    this.editorId = id;
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
    this.popoverContainerId = "popoverContainer" + "_" + id;
    this.popoverId = "popover" + "_" + id;
    this.suggestionUrl = undefined;
    this.content = function () {
        return document.getElementById(id);
    };
    this.popoverContainer = function () {
        return document.getElementById(this.popoverContainerId);
    };
    this.popov = function () {
        return document.getElementById(this.popoverId);
    };

    // Add words to be highlighted
    this.setHighlightingWords = function (arr) {
        if (arr && arr.length >= 0) {
            this.keyWordsArray = arr;
        }
    };
    //Setting of service url presume actual suggestions from server side
    this.setSuggestionsService = function (url) {
        this.suggestionUrl = url;
    };

    initStack(this);
    makeEditable(this.editorId, this);
}

var initEditus = function initEditus(id) {
    return new Editus(id);
};

exports.initEditus = initEditus;

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

var _caret = _dereq_("./caret");

var setCaretCharIndex = _caret.setCaretCharIndex;
var getCharacterOffsetWithin = _caret.getCharacterOffsetWithin;

(typeof window !== "undefined" ? window['jquery'] : typeof global !== "undefined" ? global['jquery'] : null);

//Recursively check every element in contentEditable node
function checkEveryTag(node, obj) {
    if (obj.keyWordsArray) {
        if (node.childNodes.length > 0) {
            for (var i = 0; i < node.childNodes.length; i++) {
                if (node.childNodes[i].data && node.childNodes[i].data !== "" || node.childNodes[i].nodeName === "DIV") {
                    checkEveryTag(node.childNodes[i], obj);
                }
            }
        } else {
            var ranges = makeRangesFromMatches(obj.keyWordsArray, node);
            wrapNodes(ranges, obj);
        }
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
function wrapNodes(ranges, obj) {
    for (var i = 0; i < ranges.length; i++) {
        var highlightTag = document.createElement("span");
        highlightTag.className = "highlighted";
        $(highlightTag).data(obj.editorId, ranges[i].toString());
        ranges[i].surroundContents(highlightTag);
    }
}

//Check every highlighted node for changes
function checkHighlighted(e, obj) {
    if (obj.keyWordsArray) {
        var sel = window.getSelection(),
            anchorNode = sel.anchorNode,
            nextNode = anchorNode.nextElementSibling,
            content = obj.content(),
            nodeToCheck = sel.baseNode.parentElement;
        //Handle caret positioning just before highlighted node, that prevent sticking of regular text nodes with highlighted
        if (anchorNode.length === sel.anchorOffset && (nextNode && nextNode.nodeName === "SPAN")) {
            $(nextNode).contents().unwrap();
            content.normalize();
        }
        if (nodeToCheck.className === "highlighted" || sel.baseNode.className === "highlighted") {
            var range = sel.getRangeAt(0),
                char = getCharacterOffsetWithin(range, content),
                highlighted = document.getElementById(obj.editorId).getElementsByClassName("highlighted");
            for (var i = 0; i < highlighted.length; i++) {
                var text = $(highlighted[i]).text();
                if (!new RegExp(obj.keyWordsArray.map(function (w) {
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
}

exports.checkHighlighted = checkHighlighted;
exports.checkEveryTag = checkEveryTag;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./caret":2}],4:[function(_dereq_,module,exports){
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

var initialisePopover = _suggestion.initialisePopover;
var listScroll = _suggestion.listScroll;
var destroyPopUp = _suggestion.destroyPopUp;

var execute = _dereq_("./undo_redo").execute;

//Executing on key down event
function processKeyDown(e, obj) {
    var d = new $.Deferred();
    //Handling events at suggestion popover
    if (obj.popUp && (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13)) {
        e.preventDefault();
        listScroll(e, obj);
        return d.reject();
    } else if (obj.popUp) {
        destroyPopUp(obj);
    }
    //Showing of popup with suggestions at current cursor position
    if (e.ctrlKey && e.keyCode === 32) {
        if (obj.suggestionUrl) {
            e.preventDefault();
            var position = getCursorCoordinates();
            initialisePopover(position.top + 25, position.left, obj);
            return d.reject();
        }
    }
    //Handling of undo/redo events
    if (e.metaKey && e.keyCode !== 65 && e.keyCode !== 88 && e.keyCode !== 86 && e.keyCode !== 67) {
        e.preventDefault();
        obj.meta = true;

        if (e.metaKey && e.keyCode === 90 && obj.canUndo) {
            obj.stack.undo();
        } else if (e.metaKey && e.keyCode === 89 && obj.canRedo) {
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
        if (obj.meta && offset === 0 && selection.baseNode.nodeName === "DIV" || !obj.meta && offset === 0) {
            return d.promise();
        } else {
            setCaretCharIndex(content, char);
        }
    }
    return d.promise();
}

//Make editor from contentEditable node
function makeEditable(contentId, obj) {

    var id = contentId;
    var content = obj.content();

    if (content.nodeName !== "DIV") {
        throw "Editable element must be DIV";
    }

    addSuggestionsPopover(obj);
    addEvents(content, id, obj);
}

function addSuggestionsPopover(obj) {
    var popoverString = "<div style = 'position : absolute' class = 'popoverContainer' id='" + obj.popoverContainerId + "'><a href='#' title='' data-toggle='popover' id='" + obj.popoverId + "'data-content='' data-placement='bottom'></a></div>";
    $(obj.content()).after(popoverString);
}

//Add events to contentEditable node
function addEvents(content, id, obj) {
    content.onkeyup = function (event) {
        processKeyUp(event, content, id, obj);
    };
    content.onkeydown = function (event) {
        processKeyDown(event, obj).then(execute(250, event, obj), function () {});
    };
    content.onmouseup = function () {
        process(content, obj).then(execute(0, event, obj), function () {});
    };
}
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

var execute = _dereq_("./undo_redo").execute;

var _caret = _dereq_("./caret");

var setCaretCharIndex = _caret.setCaretCharIndex;
var getCharacterOffsetWithin = _caret.getCharacterOffsetWithin;

var checkHighlighted = _dereq_("./highlighting").checkHighlighted;

(typeof window !== "undefined" ? window['jquery'] : typeof global !== "undefined" ? global['jquery'] : null);

var jQuery = _interopRequire((typeof window !== "undefined" ? window['jquery'] : typeof global !== "undefined" ? global['jquery'] : null));

(typeof window !== "undefined" ? window['bootstrap'] : typeof global !== "undefined" ? global['bootstrap'] : null);

//Popover initialisation
function initialisePopover(top, left, obj) {

    var popoverContainer = obj.popoverContainer();
    popoverContainer.style.top = top + "px";
    popoverContainer.style.left = left + "px";

    makeCorsRequest(obj);
}

//Handling Up/Down/Enter buttons in popover
function listScroll(e, obj) {
    var key = e.keyCode,
        $listItems = $(".list-group-item"),
        $selected = $listItems.filter(".selected");

    $listItems.removeClass("selected");
    //Handling Enter button
    if (key === 13 && obj.$current) {
        obj.chosen = $(obj.$current[0]).html();
        destroyPopUp(obj);
        obj.popUp = false;
        insertNodeAtCursor(document.createTextNode(obj.chosen), obj);
        return;
    }
    //Handling Down button
    if (key === 40) {
        if (!$selected.length || $selected.is(":last-child")) {
            obj.$current = $listItems.eq(0);
        } else {
            obj.$current = $selected.next();
        }
    }
    //Handling Up button
    else if (key === 38) {
        if (!$selected.length || $selected.is(":first-child")) {
            obj.$current = $listItems.last();
        } else {
            obj.$current = $selected.prev();
        }
    }
    obj.$current.addClass("selected");
}

//Insert node at current cursor position
function insertNodeAtCursor(node, obj) {
    var content = obj.content();
    var range = window.getSelection().getRangeAt(0);
    var char = getCharacterOffsetWithin(range, content);
    range.insertNode(node);
    content.normalize();
    setCaretCharIndex(content, char + node.length);
    obj.executeOnInsert = true;
}

//Destroy popover
function destroyPopUp(obj) {
    $(obj.popov()).popover("destroy");
}

//Pick and form data for request
function makeJsonForSuggestions(obj) {
    return JSON.stringify({
        text: obj.content().innerHTML,
        cursorPosition: getCharacterOffsetWithin(window.getSelection().getRangeAt(0), obj.content())
    });
}

// Create the XHR object.
function createCORSRequest(method, url, data) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        xhr.open(method, url, true);
        xhr.setRequestHeader("dataType", "json");
        xhr.setRequestHeader("data", data);
    } else {
        // CORS not supported.
        xhr = null;
    }
    return xhr;
}

// Make the actual CORS request.
function makeCorsRequest(obj) {

    var data = makeJsonForSuggestions(obj);
    var xhr = createCORSRequest("POST", obj.suggestionUrl, data);
    if (!xhr) {
        throw "CORS not supported";
    }

    xhr.onload = function () {

        var text = xhr.responseText;
        console.log("Response from CORS request to " + obj.suggestionUrl + ": " + text);

        showPopover(obj, text);
    };

    xhr.onerror = function () {
        console.log("There was an error making the request.");
    };

    xhr.send();
}

//Fill, add events and show popover
function showPopover(obj, text) {
    var list = makeListOfSuggestions(text);
    var pop = obj.popov();
    $(pop).popover({ html: true, content: list });
    $(pop).popover("show");
    obj.popUp = true;

    //Destroy popover when user takes away mouse from it
    $(".popover").mouseleave(function () {
        destroyPopUp(obj);
        obj.popUp = false;
    });
    //Triggering of choosing popup item with mouse
    $(".popover").on("mousedown", "a", function (e) {
        e.preventDefault();
        obj.chosen = e.currentTarget.innerText;
        destroyPopUp(obj);
        obj.popUp = false;
        insertNodeAtCursor(document.createTextNode(obj.chosen), obj);
        checkHighlighted(e, obj);
        execute(0, e, obj);
    });
}

//separate and wrap every suggestion
function makeListOfSuggestions(text) {
    var array = text.split(",");
    var list = "<div class='list-group'></div>";
    for (var i = 0; i < array.length; i++) {
        var b = $("<a href='#' class='list-group-item'></a>").wrapInner(array[i]);
        list = $(list).append(b);
    }
    return list;
}
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

//Configuring of stack commands for undo/redo events
function initStack(obj) {
    var content = obj.content();
    obj.stack = new Undo.Stack();

    obj.EditCommand = Undo.Command.extend({
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
            obj.startValue = content.innerHTML;
            setCaretCharIndex(content, this.undoPosition);
            obj.wasUndo = true;
        },

        redo: function redo() {
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
var execute = function execute(timeout, e, obj) {
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
        if (undoPosition === redoPosition || !obj.executeOnInsert && e.keyCode === 13) {
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
            } else {
                obj.cursorChange = true;
            }
        } else {
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

exports.execute = execute;
exports.initStack = initStack;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./caret":2}]},{},[1])(1)
});