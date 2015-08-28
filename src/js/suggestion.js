/**
 * Created by julia on 7/20/15.
 */
"use strict";

//import {execute} from './undo_redo';
import {setCaretCharIndex,getCharacterOffsetWithin} from './caret';
import 'jquery';
import jQuery from 'jquery';
import 'bootstrap';

export function Suggestion() {
    this.popUp = false;
    this.chosen = undefined;
    this.$current = undefined;
    var sg = this;
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
        var xhr = createCORSRequest('POST', obj.suggestionUrl, data);
        if (!xhr) {
            throw('CORS not supported');
        }

        xhr.onload = function () {

            var text = xhr.responseText;
            console.log('Response from CORS request to ' + obj.suggestionUrl + ': ' + text);

            showPopover(obj, text);
        };

        xhr.onerror = function () {
            console.log('There was an error making the request.');
        };

        xhr.send();
    }

//Fill, add events and show popover
    function showPopover(obj, text) {
        var list = makeListOfSuggestions(text);
        var pop = obj.popov();
        $(pop).popover({html: true, content: list});
        $(pop).popover('show');
        sg.popUp = true;

        //Destroy popover when user takes away mouse from it
        $('.popover').mouseleave(function () {
            sg.destroyPopUp(obj);
            sg.popUp = false;
        });
        //Triggering of choosing popup item with mouse
        $('.popover').on('mousedown', 'a', function (e) {
            e.preventDefault();
            sg.chosen = e.currentTarget.innerText;
            sg.destroyPopUp(obj);
            sg.popUp = false;
            insertNodeAtCursor(document.createTextNode(sg.chosen), obj);
            obj.checkHighlighted(e);
            //execute(0, e, obj);
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
    this.destroyPopUp = function (obj) {
        $(obj.popov()).popover('destroy');
    };

//Popover initialisation
    this.initialisePopover = function (top, left, obj) {

        var popoverContainer = obj.popoverContainer();
        popoverContainer.style.top = top + 'px';
        popoverContainer.style.left = left + 'px';

        makeCorsRequest(obj);
    };

//Handling Up/Down/Enter buttons in popover
    this.listScroll = function (e, obj) {
        var key = e.keyCode,
            $listItems = $('.list-group-item'),
            $selected = $listItems.filter('.selected');

        $listItems.removeClass('selected');
        //Handling Enter button
        if (key === 13 && this.$current) {
            this.chosen = $(this.$current[0]).html();
            this.destroyPopUp(obj);
            this.popUp = false;
            insertNodeAtCursor(document.createTextNode(this.chosen), obj);
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
}