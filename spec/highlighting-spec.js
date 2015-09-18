import {initEditus} from '../src/js/editus';

describe("highlighting", function () {
    var highlighting,
        editus,
        div;
    beforeEach(function () {
        div = $("<div contenteditable='true' class = 'content' id='content3'>to t</div>");
        $(document.body).append(div);
        editus = initEditus('content3');
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
    afterEach(function () {
        div.remove();
        div = null;
        editus = null;
    });
});