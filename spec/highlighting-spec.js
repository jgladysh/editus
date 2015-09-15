import {Highlighting} from '../src/js/highlighting';

describe("highlighting", function () {
    var highlighting;
    beforeEach(function() {
        highlighting = new Highlighting;
    });
    it("returns the position of word in text", function () {
        var matches = highlighting.getMatches('to','ti to');
        expect(matches[0]).toBe(3);
    });
});