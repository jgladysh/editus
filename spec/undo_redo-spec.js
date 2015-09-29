import 'jquery';
import {initEditus} from '../src/js/editus';
import {setCaretCharIndex, getCharacterOffsetWithin} from '../src/js/caret';

describe("undo_redo", function () {
    var editus2,
        div2;

    beforeEach(function () {
        var id = Math.random();
        div2 = $("<div contenteditable='true' class = 'content' id='"+ id + "'></div>");
        $(document.body).append(div2);
        editus2 = initEditus(id);
    });


    it("expect that stack was initialized", function () {
        expect(editus2.UndoRedo.stack).toBeDefined();
    });

    it("expect that nothing was saved to stack if nothing was changed", function () {
        expect(editus2.content().innerHTML).toEqual('');
        editus2.content().focus();
        editus2.UndoRedo.execute(-1, editus2.content());
        editus2.content().innerHTML = 'to';
        editus2.content().focus();
        expect(editus2.content().innerHTML).toEqual('to');
        editus2.content().focus();
        editus2.UndoRedo.execute(-1, editus2.content());
        editus2.content().focus();
        editus2.UndoRedo.execute(-1, editus2.content());
        editus2.UndoRedo.stack.undo();
        expect(editus2.content().innerHTML).toEqual('');
    });

    it("expect that undo and redo commands make changes", function () {
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

        editus2.UndoRedo.stack.redo();
        expect(editus2.content().innerHTML).toEqual('to');

        editus2.UndoRedo.stack.redo();
        expect(editus2.content().innerHTML).toEqual('to to');
    });
    afterEach(function () {
        div2.remove();
        div2 = null;
        editus2 = null;
    });
});
