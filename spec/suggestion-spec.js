import {initEditus} from '../src/js/editus';
import 'jquery';

describe("undo_redo", function () {
    var editus3,
        id,
        div3;

    beforeEach(function (done) {
        id = Math.random();
        div3 = $("<div contenteditable='true' class = 'content' id='" + id + "'></div>");
        $(document.body).append(div3);
        editus3 = initEditus(id);
        editus3.setSuggestionsService('http://localhost:8090/');
        editus3.Suggestion.initialisePopover(0, 0, editus3.content());
        setTimeout(function () {
            done();
        }, 100)
    });

    it("expect that popover container was added after initialisation", function () {
        expect(document.getElementById('popoverContainer_' + id)).not.toBe(null);
    });

    it("expect that popover is showed up", function () {
        expect(document.getElementsByClassName('popover')).not.toBe(null);
    });

    it("expect that popover list isn't empty", function () {
        expect(document.getElementsByClassName('list-group')[0].childNodes[0]).not.toBe(null);
    });

    it("expect that after clicking at element in popover it content was added to editor", function () {
        var el = document.getElementsByClassName('list-group')[0].childNodes[0];
        var offset = $(el).offset();
        var event = jQuery.Event( "mousedown", {
            which: 1,
            pageX: offset.left,
            pageY: offset.top
        });
        editus3.content().focus();
        $(el).trigger(event);
        expect(editus3.content().innerHTML).toEqual('Item_1');
    });

    afterEach(function () {
        document.getElementById('popoverContainer_' + id).remove();
        div3.remove();
        div3 = null;
        editus3 = null;
    });
});