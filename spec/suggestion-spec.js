import {initEditus} from '../src/js/editus';

describe("undo_redo", function () {
    var editus3,
        div3;

    beforeEach(function () {
        div3 = $("<div contenteditable='true' class = 'content' id='content6'> </div>");
        $(document.body).append(div3);
        editus3 = initEditus('content6');
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