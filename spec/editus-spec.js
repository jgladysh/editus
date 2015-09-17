import {initEditus} from '../src/js/editus';

describe("highlighting", function () {
    var editus,
        div;
    beforeEach(function () {
        div = $("<div contenteditable='true' class = 'content' id='content3'> </div>");
        $(document.body).append(div);
        editus = initEditus('content3');
    });
    it("check that editor object was created", function () {
        expect(editus).not.toBeUndefined();
    });
    it("check that editor has specified id", function () {
        expect(editus.content().id).toEqual('content3');
    });
    it("check that editor's highlighting function throw error without required arguments", function () {
        expect(function(){editus.setHighlightingWords(['a','aaa','aa'])}).toThrow('Class name for highlighted words in String format should be provided');
        expect(function(){editus.setHighlightingWords('')}).toThrow('Array of highlighted words should be provided');

    });
    afterEach(function () {
        div.remove();
        div = null;
        editus = null;
    });
});