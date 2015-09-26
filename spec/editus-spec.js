import {initEditus} from '../src/js/editus';

describe("highlighting", function () {
    var editus,
        span,
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
    it("check that editor's highlighting function throws error without required arguments", function () {
        expect(function(){editus.setHighlightingWords(['a','aaa','aa'])}).toThrow('Class name for highlighted words in String format should be provided');
        expect(function(){editus.setHighlightingWords('')}).toThrow('Array of highlighted words should be provided');
    });
    it("check that highlighted object was created and highlights were set", function(){
        editus.setHighlightingWords(['a','aaa','aa'], 'highlighted');
        expect(editus.Highlighting).toBeDefined();
    });
    it("check that editors suggestion function throws error without required arguments", function(){
        expect(function(){editus.setSuggestionsService();}).toThrow('url to backend suggestion service should be provided');
    });
    it("check that editors suggestion function create appropriate variables", function(){
        editus.setSuggestionsService('http://localhost:3000/');
        expect(editus.popoverContainerId).toEqual('popoverContainer_content3');
        expect(editus.popoverId).toEqual('popover_content3');
        expect(editus.Suggestion).toBeDefined();
    });
    it("check that editor throw error when element that passed isn't type of DIV", function(){
        span = $("<span contenteditable='true' class = 'content' id='content4'> </span>");
        $(document.body).append(span);
        expect(function(){initEditus('content4')}).toThrow('Editable element must be DIV');
    });
    afterEach(function () {
        div.remove();
        div = null;
        editus = null;
    });
});