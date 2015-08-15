/**
 * Created by julia on 7/20/15.
 */
"use strict";

import {execute} from './undo_redo';
import {setCaretCharIndex,getCharacterOffsetWithin} from './caret';
import{checkHighlighted} from './highlighting';
import 'jquery';
import jQuery from 'jquery';
import 'bootstrap';

var suggestions = $.parseHTML('<div class="list-group"><a href="#" class="list-group-item">Item 1</a><a href="#" class="list-group-item">Item 2</a> <a href="#" class="list-group-item">Item 3</a> <a href="#" class="list-group-item">Item 4</a> <a href="#" class="list-group-item">Item 5</a> </div>')[0];

//Popover initialisation
function initialisePopover(top, left, contentId, obj) {
    var popoverContainer = obj.popoverContainer();
    var pop = obj.popov();
    obj.chosen = undefined;
    obj.$current = undefined;
    $(pop).popover({html: true, content: suggestions});
    popoverContainer.style.top = top + 'px';
    popoverContainer.style.left = left + 'px';

    $(pop).popover('show');
    obj.popUp = true;
    //Destroy popover when user takes away mouse from it
    $('.popover').mouseleave(function () {
        destroyPopUp(obj);
        obj.popUp = false;
    });
    //Triggering of choosing popup item with mouse
    $('.popover').on('mousedown', 'a', function (e) {
        e.preventDefault();
        obj.chosen = e.currentTarget.innerText;
        destroyPopUp(obj);
        obj.popUp = false;
        insertNodeAtCursor(document.createTextNode(obj.chosen), obj);
        checkHighlighted(e, obj);
        execute(0, e, obj);
    });
}

//Handling Up/Down/Enter buttons in popover
function listScroll(e, obj) {
    var key = e.keyCode,
        $listItems = $('.list-group-item'),
        $selected = $listItems.filter('.selected');

    $listItems.removeClass('selected');
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
        if (!$selected.length || $selected.is(':last-child')) {
            obj.$current = $listItems.eq(0);
        }
        else {
            obj.$current = $selected.next();
        }
    }
    //Handling Up button
    else if (key === 38) {
        if (!$selected.length || $selected.is(':first-child')) {
            obj.$current = $listItems.last();
        }
        else {
            obj.$current = $selected.prev();
        }
    }
    obj.$current.addClass('selected');
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
    $(obj.popov()).popover('destroy');
}

export {initialisePopover, listScroll, destroyPopUp};