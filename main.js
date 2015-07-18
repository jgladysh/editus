/**
 * Created by julia on 6/22/15.
 */

var content,
    keyWordsArray = ["create", "experiment", "assign", "to", "all", "users", "where", "for", "salt", "new"],
    canRedo,
    canUndo,
    wasUndo,
    EditCommand,
    startValue,
    newValue,
    timer,
    cursorChange = false,
    position = 0,
    meta = false,
    stack = new Undo.Stack(),
    blocked = false;

var suggestions = $.parseHTML('<div class="list-group"><a href="#" class="list-group-item">Item 1</a><a href="#" class="list-group-item">Item 2</a> <a href="#" class="list-group-item">Item 3</a> <a href="#" class="list-group-item">Item 4</a> <a href="#" class="list-group-item">Item 5</a> </div>')[0];

$(document).ready(function () {
    content = $('#content')[0];
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
            blocked = true;
            this.textarea.innerHTML = this.oldValue;
            startValue = content.innerHTML;
            setCaretCharIndex(content, this.undoPosition);
            wasUndo = true;
        },

        redo: function () {
            blocked = true;
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
    clearTimeout(timer);
    timer = setTimeout(function () {
        var range = window.getSelection().getRangeAt(0),
            newValue = content.innerHTML;
        if (meta) {
            meta = false;
            return;
        }
        var undoPosition = position,
            redoPosition = getCharacterOffsetWithin(range, content);

        if (undoPosition == redoPosition || e.keyCode == 13) {
            wasUndo = false;
            return;
        }
        if (wasUndo) {
            stack.execute(new EditCommand(content, startValue, newValue, stack.commands[stack.stackPosition].redoPosition, redoPosition));
        }
        else if (undoPosition != redoPosition && newValue == startValue) {
            if (cursorChange) {
                stack.commands[stack.commands.length - 1].redoPosition = redoPosition;
            }
            else {
                cursorChange = true;
                stack.execute(new EditCommand(content, startValue, newValue, undoPosition, redoPosition));
            }

        }
        else {
            cursorChange = false;
            stack.execute(new EditCommand(content, startValue, newValue, undoPosition, redoPosition));
        }
        startValue = newValue;
        position = redoPosition;
        wasUndo = false;
    }, timeout);
};


function suggest(e) {
    if (e.shiftKey && e.keyCode == 32) {
        var position = getCursorCoordinates(),
            popoverContainer = $('.popoverContainer')[0],
            popover = $('[data-toggle="popover"]');

        initialisePopover(popover, popoverContainer, position.top + 25, position.left);
    }
    else if (e.metaKey) {
        e.preventDefault();
        meta = true;
    }

    if (e.metaKey && e.keyCode == 90 && canUndo) {
        stack.undo();
    }
    else if (e.metaKey && e.keyCode == 89 && canRedo) {
        stack.redo();
    }
}

var processOnChange = function (e) {
    var d = new $.Deferred();
    var sel = window.getSelection(),
        nodeToCheck = sel.baseNode.parentElement;
    if (sel.type == "Range") {
        return d.resolve();
    }
    if (e.keyCode == 32) {
        if (nodeToCheck.className == 'highlighted') {
            normalizeSpaceAtUndo(nodeToCheck, sel);
        }
        checkHighlighted(e);
        process();
    }
    else if (e.keyCode == 13) {
        if (content.firstChild != null && document.createRange) {
            if (nodeToCheck.childNodes[0].className == 'highlighted') {
                $(nodeToCheck.childNodes[0]).contents().unwrap();
                content.normalize();
            }
            checkHighlighted(e);
            process();
        }
    }
    else {
        if (e.keyCode != 37 & e.keyCode != 38 & e.keyCode != 39 & e.keyCode != 40 & !meta) {
            checkHighlighted(e);
        }
        else {
            process();
        }
    }
    return d.promise();
};


function process() {
    var d = new $.Deferred();
    if (content.firstChild != null) {
        var selection = window.getSelection();
        if (selection.type == "Range") {
            return d.resolve();
        }
        var range = selection.getRangeAt(0),
            char = getCharacterOffsetWithin(range, content);
        if (document.createRange) {
            checkEveryTag(content);
        }
        if ((meta && selection.baseOffset == 0 && selection.baseNode.nodeName == 'DIV') || (!meta && selection.baseOffset == 0)) {
            return d.promise();
        }
        else {
            setCaretCharIndex(content, char);
        }
    }
    return d.promise();
}


function checkEveryTag(node) {
    if (node.childNodes.length > 0) {
        for (var i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].data && node.childNodes[i].data != '' || node.childNodes[i].nodeName == 'DIV') {
                checkEveryTag(node.childNodes[i]);
            }
        }
    }
    else {
        var ranges = makeRangesFromMatches(keyWordsArray, node);
        wrapNodes(ranges);
    }
}


function getMatches(word, text) {
    var regular = new RegExp("\\b" + word + "\\b((?!\\W(?=\\w))|(?=\\s))", "gi"),
        array,
        result = [];
    while ((array = regular.exec(text)) !== null) {
        result.push(array.index);
    }
    return result;
}


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


function wrapNodes(ranges) {
    for (var i = 0; i < ranges.length; i++) {
        var highlightTag = document.createElement('span');
        highlightTag.className = 'highlighted';
        $(highlightTag).data("content", ranges[i].toString());
        ranges[i].surroundContents(highlightTag);
    }
}


function getCharacterOffsetWithin(range, node) {
    var treeWalker = document.createTreeWalker(
        node,
        NodeFilter.SHOW_TEXT,
        function (node) {
            var nodeRange = document.createRange();
            nodeRange.selectNode(node);
            return nodeRange.compareBoundaryPoints(Range.END_TO_END, range) < 1 ?
                NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
        false
    );

    var charCount = 0;
    while (treeWalker.nextNode()) {
        charCount += treeWalker.currentNode.length;
    }
    if (range.startContainer.nodeType == 3) {
        charCount += range.startOffset;
    }
    return charCount;
}


function setCaretCharIndex(containerEl, index) {
    var charIndex = 0, stop = {};

    function traverseNodes(node) {
        if (node.nodeType == 3) {
            var nextCharIndex = charIndex + node.length;
            if (index >= charIndex && index <= nextCharIndex) {
                window.getSelection().collapse(node, index - charIndex);
                throw stop;
            }
            charIndex = nextCharIndex;
        }
        else {
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
        if (ex != stop) {
            throw ex;
        }
    }
}


function getCursorCoordinates() {
    var range = window.getSelection().getRangeAt(0);
    var anchor = document.createElement('span');
    anchor.className = 'anchor';
    range.insertNode(anchor);
    var position = $('.anchor').offset();
    content.removeChild($('.anchor')[0]);
    return position;
}


function checkHighlighted(e) {
    var sel = window.getSelection(),
        anchorNode = sel.anchorNode,
        nextNode = anchorNode.nextElementSibling,
        nodeToCheck = sel.baseNode.parentElement;
    if (anchorNode.length == sel.anchorOffset && (nextNode && nextNode.nodeName == 'SPAN')) {
        $(nextNode).contents().unwrap();
        content.normalize();
    }
    if (nodeToCheck.className == 'highlighted') {
        var range = sel.getRangeAt(0),
            char = getCharacterOffsetWithin(range, content),
            highlighted = $('.highlighted');
        for (var i = 0; i < highlighted.length; i++) {
            var text = $(highlighted[i]).text();
            if (!(new RegExp(keyWordsArray.map(function (w) {
                    return '\\b' + w + '\\b((?!\\W(?=\\w))|(?=\\s))'
                }).join('|'), 'gi').test(text))) {
                $(highlighted[i]).contents().unwrap();
                content.normalize();
                if (e.keyCode != 13) {
                    setCaretCharIndex(content, char);
                }
            }
        }
    }
}

function normalizeSpaceAtUndo(nodeToCheck, selection) {
    var range = selection.getRangeAt(0),
        char = getCharacterOffsetWithin(range, content);
    $(nodeToCheck).contents().unwrap();
    content.normalize();
    setCaretCharIndex(content, char);
}


function initialisePopover(popover, popoverContainer, top, left) {
    popover.popover({html: true, content: suggestions});
    popoverContainer.style.top = top + 'px';
    popoverContainer.style.left = left + 'px';

    popover.popover('show');
    $($('.popover')[0]).mouseleave(function () {
        popover.popover('destroy')
    });
}