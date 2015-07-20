/**
 * Created by julia on 6/22/15.
 */

var content,
    meta = false;

$(document).ready(function () {
    content = $('#content')[0];
});

function processKeyDown(e) {
    var d = new $.Deferred();

    if (e.shiftKey && e.keyCode == 32) {
        var position = getCursorCoordinates();
        initialisePopover(popover, popoverContainer, position.top + 25, position.left);
    }
    else if (e.metaKey && e.keyCode != 65 && e.keyCode != 88 && e.keyCode != 86 && e.keyCode != 67) {
        e.preventDefault();
        meta = true;
    }

    if (e.metaKey && e.keyCode == 90 && canUndo) {
        stack.undo();
    }
    else if (e.metaKey && e.keyCode == 89 && canRedo) {
        stack.redo();
    }
    return d.promise();
}

function processKeyUp(e) {
    var sel = window.getSelection(),
        nodeToCheck = sel.baseNode.parentElement;

    if (sel.type == "Range") {
        return d.resolve();
    }

    if (e.keyCode == 32 || e.keyCode == 13 || meta) {
        if ((nodeToCheck.className == 'highlighted') || (e.keyCode == 13 && nodeToCheck.childNodes[0] && nodeToCheck.childNodes[0].className == 'highlighted')) {
            normalizeSpace(nodeToCheck, sel, e);
        }
        process();
        meta = false;
    }

    if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40) {
        process();
    } else {
        checkHighlighted(e);
    }
}

function process() {
    var d = new $.Deferred();

    if (content.firstChild != null) {
        var selection = window.getSelection(),
            range = selection.getRangeAt(0),
            char = getCharacterOffsetWithin(range, content);

        if (selection.type == "Range") {
            return d.resolve();
        }

        checkEveryTag(content);

        if ((meta && selection.baseOffset == 0 && selection.baseNode.nodeName == 'DIV') || (!meta && selection.baseOffset == 0)) {
            return d.promise();
        }
        else {
            setCaretCharIndex(content, char);
        }
    }
    return d.promise();
}