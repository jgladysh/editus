/**
 * Created by julia on 7/20/15.
 */
"use strict";

//import {execute} from './undo_redo';
import {setCaretCharIndex,getCharacterOffsetWithin} from './caret';
import 'jquery';
import jQuery from 'jquery';
import 'bootstrap';

export function Suggestion(url, popoverId, popoverContainerId, content) {
    this.popUp = false;
    this.chosen = undefined;
    this.$current = undefined;
    var sg = this;

//Insert node at current cursor position
    function insertNodeAtCursor(node, cont) {
        var range = window.getSelection().getRangeAt(0);
        var char = getCharacterOffsetWithin(range, cont);
        range.insertNode(node);
        cont.normalize();
        setCaretCharIndex(cont, char + node.length);
    }


//Pick and form data for request
    function makeJsonForSuggestions(cont) {
        return JSON.stringify({
            text: cont.innerHTML,
            cursorPosition: getCharacterOffsetWithin(window.getSelection().getRangeAt(0), cont)
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
    function makeCorsRequest(cont) {

        var data = makeJsonForSuggestions(cont);
        var xhr = createCORSRequest('POST', url, data);
        if (!xhr) {
            throw('CORS not supported');
        }

        xhr.onload = function () {

            var text = xhr.responseText;
            console.log('Response from CORS request to ' + url + ': ' + text);

            showPopover(cont, text);
        };

        xhr.onerror = function () {
            console.log('There was an error making the request.');
        };

        xhr.send();
    }

//Fill, add events and show popover
    function showPopover(cont, text) {
        var list = makeListOfSuggestions(text);
        var pop = document.getElementById(popoverId);
        $(pop).popover({html: true, content: list});
        $(pop).popover('show');
        sg.popUp = true;

        //Destroy popover when user takes away mouse from it
        $('.popover').mouseleave(function () {
            sg.destroyPopUp();
            sg.popUp = false;
        });
        //Triggering of choosing popup item with mouse
        $('.popover').on('mousedown', 'a', function (e) {
            e.preventDefault();
            sg.chosen = e.currentTarget.innerText;
            sg.destroyPopUp();
            sg.popUp = false;
            insertNodeAtCursor(document.createTextNode(sg.chosen), cont);
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

    //Destroy popover
    this.destroyPopUp = function () {
        $(document.getElementById(popoverId)).popover('destroy');
    };

//Popover initialisation
    this.initialisePopover = function (top, left, cont) {
        this.popoverContainer = document.getElementById(popoverContainerId);
        this.popoverContainer.style.top = top + 'px';
        this.popoverContainer.style.left = left + 'px';

        makeCorsRequest(cont);
    };

    this.triggerKeyDown = function (cont, e) {
        if (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13) {
            e.preventDefault();
            this.listScroll(e, cont);
        }
        else {
            this.destroyPopUp();
        }
    };

//Handling Up/Down/Enter buttons in popover
    this.listScroll = function (e, cont) {
        var key = e.keyCode,
            $listItems = $('.list-group-item'),
            $selected = $listItems.filter('.selected');

        $listItems.removeClass('selected');
        //Handling Enter button
        if (key === 13 && this.$current) {
            this.chosen = $(this.$current[0]).html();
            this.destroyPopUp();
            this.popUp = false;
            insertNodeAtCursor(document.createTextNode(this.chosen), cont);
            return;
        }
        //Handling Down button
        if (key === 40) {
            if (!$selected.length || $selected.is(':last-child')) {
                this.$current = $listItems.eq(0);
            }
            else {
                this.$current = $selected.next();
            }
        }
        //Handling Up button
        else if (key === 38) {
            if (!$selected.length || $selected.is(':first-child')) {
                this.$current = $listItems.last();
            }
            else {
                this.$current = $selected.prev();
            }
        }
        this.$current.addClass('selected');
    };

    (function addSuggestionsPopover(content) {
        var popoverString = "<div style = 'position : absolute' class = 'popoverContainer' id='" +
            popoverContainerId +
            "'><a href='#' title='' data-toggle='popover' id='" +
            popoverId +
            "'data-content='' data-placement='bottom'></a></div>";
        $(content).after(popoverString);
    })(content);
}