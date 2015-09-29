import {initEditus} from '../src/js/editus';

describe("undo_redo", function () {
    var editus3,
        div3;

    beforeEach(function () {
        var id = Math.random();
        div3 = $("<div contenteditable='true' class = 'content' id='"+ id + "'></div>");
        $(document.body).append(div3);
        editus3 = initEditus(id);
    });

    it("expect that popover container was added after initialisation", function () {
        editus3.setSuggestionsService('http://localhost:3000/');
        expect(document.getElementById('popoverContainer_content6')).toBeDefined();
    });

    afterEach(function () {
        div3.remove();
        div3 = null;
        editus3 = null;
    });
});