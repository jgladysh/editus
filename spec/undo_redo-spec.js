import 'jquery';
import {initEditus} from '../src/js/editus';
import {setCaretCharIndex} from '../src/js/caret';

describe("undo_redo", function () {
    var editus2,
        div2;

    beforeEach(function () {
        div2 = $("<div contenteditable='true' class = 'content' id='content5'></div>");
        $(document.body).append(div2);
        editus2 = initEditus('content5');
    });


    afterEach(function () {
        jasmine.clock().uninstall();
    });


    it("expect that stack was initialized", function () {
        expect(editus2.UndoRedo.stack).toBeDefined();
    });

    it("expect that undo command make changes", function () {
        expect(editus2.content().innerHTML).toEqual('');
        editus2.content().innerHTML = 'to';
        editus2.content().focus();
        editus2.UndoRedo.execute(-1, editus2.content());
        expect(editus2.content().innerHTML).toEqual('to');

        editus2.content().innerHTML = 'to to';
        editus2.content().focus();
        editus2.UndoRedo.execute(-1, editus2.content());
        expect(editus2.content().innerHTML).toEqual('to to');

        editus2.UndoRedo.stack.undo();
        expect(editus2.content().innerHTML).toEqual('to');

        editus2.UndoRedo.stack.undo();
        expect(editus2.content().innerHTML).toEqual('');
    });
    afterEach(function () {
        div2.remove();
        div2 = null;
        editus2 = null;
    });
});
