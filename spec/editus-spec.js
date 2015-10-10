import {initEditus} from '../src/js/editus';

describe("highlighting", function () {
    var editus,
        span,
        id,
        div;
    beforeEach(function () {
        id = Math.random();
        div = $("<div contenteditable='true' class = 'content' id='" + id + "'></div>");
        $(document.body).append(div);
        editus = initEditus(id);
    });
    it("check that editor object was created", function () {
        expect(editus).not.toBeUndefined();
    });
    it("check that editor has specified id", function () {
        expect(editus.content().id).toEqual(id.toString());
    });
    it("check that editor's highlighting function throws error without required arguments", function () {
        expect(function () {
            editus.setHighlightingWords(['a', 'aaa', 'aa'])
        }).toThrow('Class name for highlighted words in String format should be provided');
        expect(function () {
            editus.setHighlightingWords('')
        }).toThrow('Array of highlighted words should be provided');
    });
    it("check that highlighted object was created and highlights were set", function () {
        editus.setHighlightingWords(['a', 'aaa', 'aa'], 'highlighted');
        expect(editus.highlights.length).not.toEqual(0);
    });
    it("check that editors suggestion function throws error without required arguments", function () {
        expect(function () {
            editus.setSuggestionsService();
        }).toThrow('url to backend suggestion service should be provided');
    });
    it("check that editors suggestion function create appropriate variables", function () {
        editus.setSuggestionsService('http://localhost:3000/');
        expect(editus.popoverContainerId).toEqual('popoverContainer_' + id);
        expect(editus.popoverId).toEqual('popover_' + id);
        expect(editus.Suggestion).toBeDefined();
    });
    it("check that editor throw error when element that passed isn't type of DIV", function () {
        span = $("<span contenteditable='true' class = 'content' id='content4'> </span>");
        $(document.body).append(span);
        expect(function () {
            initEditus('content4')
        }).toThrow('Editable element must be DIV');
    });
    afterEach(function () {
        div.remove();
        div = null;
        editus = null;
    });
});