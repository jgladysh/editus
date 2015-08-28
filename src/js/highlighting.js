/**
 * Created by julia on 7/20/15.
 */
"use strict";

import 'jquery';
export function Highlighting() {

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
            var highlightTag = document.createElement('span');
            highlightTag.className = 'highlighted';
            $(highlightTag).data(obj.editorId, ranges[i].toString());
            ranges[i].surroundContents(highlightTag);
        }
    }

    //Recursively check every element in contentEditable node
    this.checkEveryTag = function (node, obj) {
        if (obj.keyWordsArray) {
            if (node.childNodes.length > 0) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    if (node.childNodes[i].data && node.childNodes[i].data !== '' || node.childNodes[i].nodeName === 'DIV') {
                        this.checkEveryTag(node.childNodes[i], obj);
                    }
                }
            }
            else {
                var ranges = makeRangesFromMatches(obj.keyWordsArray, node);
                wrapNodes(ranges, obj);
            }
        }
    };
}