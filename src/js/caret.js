/**
 * Created by julia on 7/20/15.
 */

"use strict";

require('jquery');

//Get index of character after which the cursor is positioned
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
        if (range.startContainer.nodeType === 3) {
            charCount += range.startOffset;
        }
        return charCount;
    }

//Set the cursor after specified character
    function setCaretCharIndex(containerEl, index) {
        var charIndex = 0, stop = {};

        function traverseNodes(node) {
            if (node.nodeType === 3) {
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
            if (ex !== stop) {
                throw ex;
            }
        }
    }

//Get the cursor coordinates position inside editor
//At contentEditable element for this needed to create temporary span element at caret position, get it coordinates and then remove it
    function getCursorCoordinates() {
        var range = window.getSelection().getRangeAt(0);
        var anchor = document.createElement('span');
        anchor.className = 'anchor';
        range.insertNode(anchor);
        var position = $('.anchor').offset();
        anchor.parentNode.removeChild($('.anchor')[0]);
        return position;
    }

    export{getCursorCoordinates,setCaretCharIndex,getCharacterOffsetWithin};