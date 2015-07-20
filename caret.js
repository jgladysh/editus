/**
 * Created by julia on 7/20/15.
 */

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


function normalizeSpace(nodeToCheck, selection, e) {
    if (e.keyCode == 13) {
        $(nodeToCheck.childNodes[0]).contents().unwrap();
    }
    if (e.keyCode == 32) {
        var range = selection.getRangeAt(0),
            char = getCharacterOffsetWithin(range, content);
        $(nodeToCheck).contents().unwrap();
        setCaretCharIndex(content, char);
    }
    content.normalize();
}