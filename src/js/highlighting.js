/**
 * Created by julia on 7/20/15.
 */
"use strict";

import {setProcessing} from './main';
import {setCaretCharIndex,getCharacterOffsetWithin} from './caret';
require('jquery');

//Array of words, that should be highlighted
var keyWordsArray = ["create", "experiment", "assign", "to", "all", "users", "where", "for", "salt", "new"],
    content;


$(document).ready(function () {
    content = $('#content')[0];
});

//Recursively check every element in contentEditable node
function checkEveryTag(node) {
    if (node.childNodes.length > 0) {
        for (var i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].data && node.childNodes[i].data !== '' || node.childNodes[i].nodeName === 'DIV') {
                checkEveryTag(node.childNodes[i]);
            }
        }
    }
    else {
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
        var highlightTag = document.createElement('span');
        highlightTag.className = 'highlighted';
        $(highlightTag).data("content", ranges[i].toString());
        ranges[i].surroundContents(highlightTag);
    }
}

//Check every highlighted node for changes
function checkHighlighted(e) {
    var sel = window.getSelection(),
        anchorNode = sel.anchorNode,
        nextNode = anchorNode.nextElementSibling,
        nodeToCheck = sel.baseNode.parentElement;
    //Handle caret positioning just before highlighted node, that prevent sticking of regular text nodes with highlighted
    if (anchorNode.length === sel.anchorOffset && (nextNode && nextNode.nodeName === 'SPAN')) {
        $(nextNode).contents().unwrap();
        content.normalize();
        setProcessing(true);
    }
    if (nodeToCheck.className === 'highlighted' || sel.baseNode.className === 'highlighted') {
        var range = sel.getRangeAt(0),
            char = getCharacterOffsetWithin(range, content),
            highlighted = $('.highlighted');
        for (var i = 0; i < highlighted.length; i++) {
            var text = $(highlighted[i]).text();
            if (!(new RegExp(keyWordsArray.map(function (w) {
                    return '^' + w + '$';
                }).join('|'), 'gi').test(text))) {
                $(highlighted[i]).contents().unwrap();
                content.normalize();
                if (e.keyCode !== 13) {
                    setCaretCharIndex(content, char);
                }
            }
        }
    }
}

export{checkHighlighted,checkEveryTag};
