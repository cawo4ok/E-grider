ui.controller('pageController', ['$scope', '$element', '$document', '$compile', function ($scope, $element, $document, $compile) {

    $scope.$watch('row', function (newValue, oldValue) {
        console.log(newValue);
    });
    $scope.objFilter = [
    {
        field: "Number",
        value: ""
    },
    {
        field: "Text1",
        value: ""
    },
    {
        field: "Text2",
        value: ""
    },
    {
        field: "Text3",
        value: ""
    },
    ];
}]);