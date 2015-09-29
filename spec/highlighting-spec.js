import {initEditus} from '../src/js/editus';
import {setCaretCharIndex} from '../src/js/caret';

describe("highlighting", function () {
    var highlighting,
        editus,
        editus1,
        div,
        div1,
        selection;

    beforeEach(function () {
        var id = Math.random();
        div = $("<div contenteditable='true' class = 'content' id='"+ id + "'>to t</div>");
        $(document.body).append(div);
        editus = initEditus(id);
        editus.setHighlightingWords(['to', 'all', 'users'], 'highlighted');
        highlighting = editus.Highlighting;
    });
    it("returns the position of word in text", function () {
        var matches = highlighting.getMatches('to', 'ti to');
        expect(matches[0]).toBe(3);
    });
    it("check that node was wrapped", function () {
        highlighting.checkEveryTag(editus.content());
        expect(editus.content().childNodes[1].nodeName).toEqual('SPAN');
    });
    it("check that node was unwrapped", function () {
        div1 = $("<div contenteditable='true' class='content' id='content1'><span class='highlighted'>tot</span>&nbsp;the&nbsp;</div>");
        $(document.body).append(div1);
        editus1 = initEditus('content1');
        editus1.setHighlightingWords(['to', 'all', 'users'], 'highlighted');
        editus1.content().focus();
        setCaretCharIndex(editus1, 0);
        selection = window.getSelection();
        expect(editus1.content().childNodes[0].nodeName).toEqual('SPAN');
        highlighting.checkHighlighted(editus1.content(), selection);
        expect(editus1.content().childNodes[0].nodeName).not.toEqual('SPAN');
    });
    afterEach(function () {
        div.remove();
        div = null;
        editus = null;
    });
});