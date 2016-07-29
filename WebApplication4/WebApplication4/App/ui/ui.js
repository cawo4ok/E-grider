var ui = angular.module('ui', ['vs-repeat', 'ang-drag-drop', 'ui-notification'])
.constant('_', window._)
.run(function ($rootScope) {
    $rootScope._ = window._;
})
.config(function (NotificationProvider) {
    NotificationProvider.setOptions({
        delay: 10000,
        startTop: 20,
        startRight: 10,
        verticalSpacing: 20,
        horizontalSpacing: 20,
        positionX: 'left',
        positionY: 'bottom'
    });
});
