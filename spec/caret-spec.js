import {getCursorCoordinates,setCaretCharIndex,getCharacterOffsetWithin} from '../src/js/caret';

describe("caret", function () {
    var editus4,
        div4;

    beforeEach(function () {
        var id = Math.random();
        div4 = $("<div contenteditable='true' class = 'content' id='"+ id + "'></div>");
        $(document.body).append(div4);
        editus4 = initEditus(id);
    });

    it("expect that caret has been set in right place", function () {
        editus4.content().innerHTML ='to to to to to';
        editus4.content().focus();
        setCaretCharIndex(editus4.content(), 5);
        expect(window.getSelection().anchorOffset).toEqual(5);
    });

    it("expect that function return right caret position", function () {
        editus4.content().innerHTML ='to to to to to';
        editus4.content().focus();
        setCaretCharIndex(editus4.content(), 5);
        var range = window.getSelection().getRangeAt(0);
        expect(getCharacterOffsetWithin(range,editus4.content())).toEqual(5);
    });

    afterEach(function () {
        div4.remove();
        div4 = null;
        editus4 = null;
    });
});