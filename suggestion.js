/**
 * Created by julia on 7/20/15.
 */

var popoverContainer,
    popover,
    $listItems,
    popUp = false,
    chosen,
    $current,
    executeOnInsert = false;
suggestions = $.parseHTML('<div class="list-group"><a href="#" class="list-group-item">Item 1</a><a href="#" class="list-group-item">Item 2</a> <a href="#" class="list-group-item">Item 3</a> <a href="#" class="list-group-item">Item 4</a> <a href="#" class="list-group-item">Item 5</a> </div>')[0];

$(document).ready(function () {
    popoverContainer = $('.popoverContainer')[0];
    popover = $('[data-toggle="popover"]');
});

//Popover initialisation
function initialisePopover(popover, popoverContainer, top, left) {
    chosen = undefined;
    $current = undefined;
    popover.popover({html: true, content: suggestions});
    popoverContainer.style.top = top + 'px';
    popoverContainer.style.left = left + 'px';

    popover.popover('show');
    //Destroy popover when user takes away mouse from it
    $('.popover').mouseleave(function () {
        popover.popover('destroy');
        popUp = false;
    });
    //Triggering of choosing popup item with mouse
    $('.popover').on('mousedown','a',function (e) {
        e.preventDefault();
        chosen = e.currentTarget.innerText;
        popover.popover('destroy');
        popUp = false;
        insertNodeAtCursor(document.createTextNode(chosen));
        checkHighlighted(e);
        execute(0,e);
    })
}

//Handling Up/Down/Enter buttons in popover
function listScroll(e) {
    var key = e.keyCode,
        $listItems = $('.list-group-item'),
        $selected = $listItems.filter('.selected');

    $listItems.removeClass('selected');
    //Handling Enter button
    if (key == 13 && $current) {
        chosen = $($current[0]).html();
        popover.popover('destroy');
        popUp = false;
        insertNodeAtCursor(document.createTextNode(chosen));
        return;
    }
    //Handling Down button
    if (key == 40)
    {
        if (!$selected.length || $selected.is(':last-child')) {
            $current = $listItems.eq(0);
        }
        else {
            $current = $selected.next();
        }
    }
    //Handling Up button
    else if (key == 38)
    {
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
    var range = window.getSelection().getRangeAt(0);
    var char = getCharacterOffsetWithin(range, content);
    range.insertNode(node);
    content.normalize();
    setCaretCharIndex(content, char + node.length);
    executeOnInsert = true;
}