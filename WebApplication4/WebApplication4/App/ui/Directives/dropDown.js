ui.directive('dropDown', function () {
    return {
        restrict: 'E',
        replace: true,
        scope:{
            dropData: "=",
            scrollPosition: "=",
            cols: "=",
            confirmed:"="
        },
        controller: "dropDownCtrl as ctrl",
        templateUrl: 'App/ui/Templates/dropDown.html',
        link: function (scope) {
            scope.listArray = scope.dropData;
        }
    };
})
.controller('dropDownCtrl', ['$scope', '$compile', 'Notification', function ($scope, $compile, Notification) {
    var isOpened = false,
        divForInner = null,
        elementContext =
       '<div class="drop-down-main">\
            <div class="drop-down-main">\
                <ul class="drop-down-list">\
                    <li style="height:0px; list-style: none;"><input type="text" class="inputForFocus" style="height:0px; border:none; width:0;"/></li>\
                    <li>Lets hide:</li>\
                    <li ng-repeat="col in cols">\
                        <input type="checkbox" ng-model="confirmed[col.title]" ng-mousedown="ctrl.change(col.title)"/>\
                        {{col.title}}\
                    </li>\
                </ul>\
            </div>\
        </div>',
        self = this;

    this.OpenDropDown = function (e) {
        var insertedElement,
            insInput;

        e.stopPropagation();
        if (isOpened) {
            return self.removeDrop();
        }
        isOpened = true;

        /*Inserting and compiling data*/
        divForInner = angular.element(elementContext).css('left', e.target.x - e.target.offsetLeft + 'px').css('top', e.target.y + e.target.offsetHeight + 'px');
        insertedElement = angular.element('body').append(divForInner);
        $compile(divForInner)($scope);

        /*Focus*/
        insInput = divForInner.find('.inputForFocus').focus();
        insInput.focusout(function () {
            self.removeDrop();
        });
    };
    this.change = function (title) {
        var closed = 0,
            confirmed = $scope.confirmed;

        for (var key in confirmed) {
            if (confirmed[key] == true) {
                closed++;
            }
        }
        if ($scope.cols.length > closed+1) {
            confirmed[title] = typeof confirmed[title] == "undefined" ? true : !confirmed[title];
        }
        else {
            typeof confirmed[title] == "undefined" || confirmed[title] === false ? Notification.error({ message: 'Sorry, but you can\'t remove last one column!', title: 'Error', positionY: 'top', positionX: 'right', delay: 4000 }) : confirmed[title] = !confirmed[title];
        }
    };
    this.select = function (list) {
        console.log(list);
    };
    this.removeDrop = function () {
        divForInner.remove();
        divForInner = null;
        isOpened = false;
    };
}]);