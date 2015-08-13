/**
 * Created by julia on 7/20/15.
 */
"use strict";

import {execute} from './undo_redo';
import {setCaretCharIndex,getCharacterOffsetWithin} from './caret';
import{checkHighlighted} from './highlighting';
import{setExecuteOnInsert} from './undo_redo';
import 'jquery';
import jQuery from 'jquery';
import 'bootstrap';

var popoverContainer,
    pop,
    id,
    popUp = false,
    chosen,
    $current,
    suggestions = $.parseHTML('<div class="list-group"><a href="#" class="list-group-item">Item 1</a><a href="#" class="list-group-item">Item 2</a> <a href="#" class="list-group-item">Item 3</a> <a href="#" class="list-group-item">Item 4</a> <a href="#" class="list-group-item">Item 5</a> </div>')[0];

//Popover initialisation
function initialisePopover(top, left, contentId) {
    id = contentId;
    popoverContainer = $('.popoverContainer')[0];
    pop = $('[data-toggle="popover"]');
    chosen = undefined;
    $current = undefined;
    pop.popover({html: true, content: suggestions});
    popoverContainer.style.top = top + 'px';
    popoverContainer.style.left = left + 'px';

    pop.popover('show');
    popUp = true;
    //Destroy popover when user takes away mouse from it
    $('.popover').mouseleave(function () {
        destroyPopUp();
        popUp = false;
    });
    //Triggering of choosing popup item with mouse
    $('.popover').on('mousedown', 'a', function (e) {
        e.preventDefault();
        chosen = e.currentTarget.innerText;
        destroyPopUp();
        popUp = false;
        insertNodeAtCursor(document.createTextNode(chosen));
        checkHighlighted(e, id);
        execute(0, e);
    });
}

//Handling Up/Down/Enter buttons in popover
function listScroll(e) {
    var key = e.keyCode,
        $listItems = $('.list-group-item'),
        $selected = $listItems.filter('.selected');

    $listItems.removeClass('selected');
    //Handling Enter button
    if (key === 13 && $current) {
        chosen = $($current[0]).html();
        destroyPopUp();
        popUp = false;
        insertNodeAtCursor(document.createTextNode(chosen));
        return;
    }
    //Handling Down button
    if (key === 40) {
        if (!$selected.length || $selected.is(':last-child')) {
            $current = $listItems.eq(0);
        }
        else {
            $current = $selected.next();
        }
    }
    //Handling Up button
    else if (key === 38) {
        if (!$selected.length || $selected.is(':first-child')) {
            $current = $listItems.last();
        }
        else {
            $current = $selected.prev();
        }
    }
    $current.addClass('selected');
}

//Insert node at current cursor position
function insertNodeAtCursor(node) {
    var content = document.getElementById(id);
    var range = window.getSelection().getRangeAt(0);
    var char = getCharacterOffsetWithin(range, content);
    range.insertNode(node);
    content.normalize();
    setCaretCharIndex(content, char + node.length);
    setExecuteOnInsert(true);
}

//Return boolean value (true, if popover displayed)
function getPopUp(){
    return popUp;
}

//Destroy popover
function destroyPopUp(){
    pop.popover('destroy');
}

export { getPopUp, initialisePopover, listScroll, destroyPopUp};