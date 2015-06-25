/**
 * Created by julia on 6/22/15.
 */

var node = '',
    content,
    keyWordsArray = ['create', 'experiment', 'assign', 'to', 'all', 'users', 'where', 'for', 'salt', 'new'];

$(document).ready(function () {
    content = $('#content')[0];
});

function processOnChange() {
    if (window.event.keyCode == 32) {
        process();
    }
    else {
        var sel = window.getSelection(),
            nodeToCheck = sel.baseNode.parentElement;
        if (nodeToCheck.className == 'highlighted') {
            process();
        }
    }
}

function process() {
    if (content.firstChild != null) {
        var selection = window.getSelection();
        if (selection.type == "Range") {
            return;
        }
        var range = selection.getRangeAt(0),
            char = getCharacterOffsetWithin(range, content);
        highlight(keyWordsArray);
        setCaretCharIndex(content, char);
    }
}

function highlight(arr) {
    var root = content.childNodes;

    for (var i = 0; i < root.length; i++) {
        if (root[i].nodeName == 'SPAN') {
            node += $(root[i]).html();
        }
        else {
            node += root[i].nodeValue;
        }
    }

    $(content).html(node);
    var str = content.firstChild,
        strNode = str.nodeValue,
        ranges = [];
    if (document.createRange) {
        for (var j = 0; j < arr.length; j++) {
            var word = arr[j],
                matches = getMatches(word, strNode);
            if (matches.length > 0) {
                var matchArray = [];
                for (var l = 0; l < matches.length; l++) {
                    var rng = document.createRange();
                    rng.setStart(str, matches[l]);
                    rng.setEnd(str, matches[l] + word.length);
                    matchArray[l] = rng;
                }
                ranges = ranges.concat(matchArray);
            }
        }
    }
    for (var k = 0; k < ranges.length; k++) {
        var highlightDiv = document.createElement('span');
        highlightDiv.style.color = 'blue';
        highlightDiv.style.fontWeight = 'bold';
        highlightDiv.className = 'highlighted';
        ranges[k].surroundContents(highlightDiv);
    }
    node = '';
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

function getMatches(word, text) {
    var regular = new RegExp("\\b" + word + "\\b((?!\\W(?=\\w))|(?=\\s))", "gi"),
        array,
        result = [];
    while ((array = regular.exec(text)) !== null) {
        result.push(array.index);
    }
    return result;
}
