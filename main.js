/**
 * Created by julia on 6/22/15.
 */

var node = '',
    content,
    wrapper,
    keyWordsArray = ['create', 'experiment', 'assign', 'to', 'all', 'users', 'where', 'for', 'salt', 'new'];

var suggestions = $.parseHTML('<div class="list-group"><a href="#" class="list-group-item">Item 1</a><a href="#" class="list-group-item">Item 2</a> <a href="#" class="list-group-item">Item 3</a> <a href="#" class="list-group-item">Item 4</a> <a href="#" class="list-group-item">Item 5</a> </div>')[0];

$(document).ready(function () {
    content = $('#content')[0];
    wrapper = $('#wrapper')[0];
});


function suggest(e) {
    if (e.shiftKey && e.keyCode == 32) {
        var position = getCursorCoordinates(),
            popoverContainer = $('.popoverContainer')[0],
            popover = $('[data-toggle="popover"]');

        initialisePopover(popover, popoverContainer, position.top + 25, position.left);
    }
}


function processOnChange(e) {
    if (e.keyCode == 32) {
        process();
    } else if (e.keyCode == 13) {
        if (content.firstChild != null && document.createRange) {
            checkEveryTag(content);
        }
    }
    else {
        var sel = window.getSelection(),
            anchorNode = sel.anchorNode,
            nextNode = anchorNode.nextElementSibling,
            nodeToCheck = sel.baseNode.parentElement;
        if (anchorNode.length == sel.anchorOffset && (nextNode && nextNode.nodeName == 'SPAN')) {
            $(nextNode).contents().unwrap();
            content.normalize();
        }
        if (nodeToCheck.className == 'highlighted') {
            var selection = window.getSelection(),
                range = selection.getRangeAt(0),
                char = getCharacterOffsetWithin(range, content);
            checkHighlighted();
            setCaretCharIndex(content, char);
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
        if (document.createRange) {
            checkEveryTag(content);
        }
        setCaretCharIndex(content, char);
    }
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
        console.log(node.data)
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


function checkHighlighted() {
    var highlighted = $('.highlighted');
    for (var i = 0; i < highlighted.length; i++) {
        if ($(highlighted[i]).text() != $.trim($(highlighted[i]).data('content'))) {
            $(highlighted[i]).contents().unwrap();
            content.normalize();
        }
    }
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