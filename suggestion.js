/**
 * Created by julia on 7/20/15.
 */

var popoverContainer,
    popover,
    suggestions = $.parseHTML('<div class="list-group"><a href="#" class="list-group-item">Item 1</a><a href="#" class="list-group-item">Item 2</a> <a href="#" class="list-group-item">Item 3</a> <a href="#" class="list-group-item">Item 4</a> <a href="#" class="list-group-item">Item 5</a> </div>')[0];

$(document).ready(function () {
    popoverContainer = $('.popoverContainer')[0];
    popover = $('[data-toggle="popover"]');
});

function initialisePopover(popover, popoverContainer, top, left) {
    popover.popover({html: true, content: suggestions});
    popoverContainer.style.top = top + 'px';
    popoverContainer.style.left = left + 'px';

    popover.popover('show');
    $($('.popover')[0]).mouseleave(function () {
        popover.popover('destroy')
    });
}
