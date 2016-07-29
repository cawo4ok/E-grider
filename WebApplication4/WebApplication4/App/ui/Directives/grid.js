ui.directive('grid', function () {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: {
            selected: "=",
            filter: "=",
            api: "="
        },
        controller: "TableController as ctrl",
        templateUrl: "App/ui/Templates/grid.html"
    };
})
.service("generateMarkupGridProvider", function () {
    this.main = function (col, visibleColumns, columnDropArray) {
        var Row = '',
            inTdLevel = '';
        if (columnDropArray.length == 0) {
            col.forEach(function (item, i, arr) {
                if (visibleColumns[item.title]) {
                    Row += '';
                }
                else if (typeof visibleColumns[item.field] === "undefined" || visibleColumns[item.field] === false) {
                    Row += '<td class="grid-item">{{line["' + item.field + '"]}}</td>';
                }
            });

            return '<tbody vs-repeat vs-scroll-parent=".grid-scrolltable">\
                <tr ng-repeat="line in arrayList track by $index" ng-click="ctrl.isSelectedRow(line, $index)" ng-class="{\'grid-line-item\': true, \'grid-selected\':selectedRow==$index}" data-ng-init="ctrl.collumnHtml(line)">\
                ' + Row + '</tr>\
            </tbody>';
        }

        /*if grouping*/
        for (var i = columnDropArray.length, j = 0; i > j; i--) {
            inTdLevel = '<div class="group-tree"  ng-click="ctrl.addClickedChild($event)" criteriy-value="{{line[\'' + columnDropArray[i - 1].field + '\']}}" criteriy-field="' + columnDropArray[i - 1].field + '">{{line["' + columnDropArray[i - 1].field + '"]}}</div>';
        }
        Row += '<td class="grid-item" >' + inTdLevel + '</td>';
        col.forEach(function (item, i, arr) {
            if (visibleColumns[item.title] !== true) {
                Row += '<td class="grid-item" ></td>';
            }
        });
        console.log(Row);
        return '<tbody vs-scroll-parent=".grid-scrolltable" vs-repeat>\
            <tr ng-repeat="line in arrayList track by $index" data-ng-init="ctrl.collumnHtml(line)" ng-class="{\'grid-line-item\': true, \'grid-selected\':selectedRow==$index}">\
            ' + Row + '</tr>\
        </tbody>';
    };
    this.header = function (treeList, columns) {
        var header = '';
        treeList.forEach(function (row, index, treeList) {
            var rowString = '',
                globalIteral = 0;

            row.forEach(function (item, i, cell) {
                var title = item.item.title,
                    indexColumn;
                if (!item.isHasMenu) {
                    rowString += '<td ui-on-drop="ctrl.dragAndDrop.Handler(\'drop\',' + index + ',' + i + ',' + item._id + ',false,\'' + item.item.title + '\')" ng-mousedown="ctrl.dragAndDrop.Handler(\'drag\',' + index + ',' + i + ',' + item._id + ',false,\'' + item.item.title + '\')" ui-draggable="true" drag-channel="' + item.channel + '" drop-channel="' + item.channel + '" rowspan="' + item.rowspan + '" colspan="' + item.colspan + '" class="grid-header">' + title + '</td>';
                } else {
                    indexColumn = columns.indexOf(item.item);
                    rowString += '<td ui-on-drop="ctrl.dragAndDrop.Handler(\'drop\',' + index + ',' + i + ',' + item._id + ',true,\'' + item.item.title + '\')" ng-mousedown="ctrl.dragAndDrop.Handler(\'drag\',' + index + ',' + i + ',' + item._id + ',true,\'' + item.item.title + '\')" ui-draggable="true" drag-channel="' + item.channel + '" drop-channel="' + item.channel + '" rowspan="' + item.rowspan + '" colspan="' + item.colspan + '" class="grid-header" ng-class="ctrl.isSelectedCol(\'' + indexColumn + '\')" ng-click="ctrl.changeSorting(\'' + indexColumn + '\')" index="' + globalIteral + '"><span>' + title + '</span> <drop-down drop-data="item.menu" cols="columns"  confirmed="visibleColumns"></drop-down></td>';
                }
            });
            header += "<tr>" + rowString + "</tr>";
        });
        return header;
    };
})
.service("groupDataProvider", function ($q) {
    this.get = function (provider) {
        var groupList = [],
            clicked = [];
        return {
            setClicked:function(clickedArray){
                clicked = clickedArray;
            },
            getClicked:function(){
                return clicked;
            },
            setGroup: function (groupBy) {
                groupList = groupBy;
            },
            getGroup:function(){
                return groupList;
            },
            getData: function (сonfigData) {
                var groupArray = this.getGroup(),
                    clicked = this.getClicked();
                    self = this,
                    deferred = $q.defer();

                    console.log(clicked);

                provider.getData(сonfigData).then(function (data) {
                    var sortedArray = [];
                    if (groupArray.length == 0) {
                        deferred.resolve(data);
                        return deferred.promise;
                    }
                    /*Sorting with all groupArray lines*/
                    var stringSorting = '',
                    sortedArray,
                    uniqGroupElement;

                    groupArray.forEach(function (line, i, arr) {
                        stringSorting += groupArray[i].field;
                        if (i + 1 !== arr.length) {
                            stringSorting += ' ';
                        }
                    });
                    sortedArray = _.sortBy(data, stringSorting);
                    var uniqArray = _.uniqBy(data, groupArray[0].field.toString());


                    deferred.resolve(uniqArray);
                });
                return deferred.promise;
            }
        };
    }    
})
.controller('TableController', ['$scope', '$attrs', '$compile', 'Notification', "groupDataProvider", "generateMarkupGridProvider", function Controller($scope, $attrs, $compile, Notification, groupDataProvider, generateMarkupGridProvider) {
    $scope.columns = [];
    $scope.visibleColumns = {};
    $scope.arrayList = [];
    $scope.selectedRow = null;
    $scope.sort = {
        column: 'Number',
        order: 'asc'
    };
    $scope.columnDropArray = [];
    $scope.api = {
        refresh: function () { self.loadData(false); }
    };

    var collumnsProvider = null,
        self = this,
        dataProvider = null,
        setDataProvider = null,
        scroll = {},
        findChangingElements = {},
        dragAndDrop = {},
        clickedChild = [];

    this.setCollumnsProvider = function (provider) {
        collumnsProvider = provider;
        $scope.columnsGroup = collumnsProvider.getCollumns();
        $scope.columns = self.getColumnsArray($scope.columnsGroup);
    };
    this.setDataProvider = function (provider) {
        setDataProvider = groupDataProvider.get(provider);
        this.loadData(false);
    };
    this.loadData = function (isAppend) {
        var filter = typeof $scope.filter == "undefined" ? [] : $scope.filter;
        setDataProvider.setGroup($scope.columnDropArray);
        setDataProvider.setClicked(clickedChild);
        setDataProvider.getData({ filter: filter, sort: $scope.sort, next: isAppend }).then(function (data) {
            $scope.arrayList = isAppend ? $scope.arrayList.concat(data) : data;
            console.log("Data is: ", data);
        });
    };
    this.loadMore = function () {
        this.loadData(true);
    };
    this.isSelectedCol = function (index) {
        return ($scope.columns[index].field == $scope.sort.column) ? 'grid-sort-' + $scope.sort.order : 'grid-sort-default';
    };
    this.changeSorting = function (index) {
        var sort = $scope.sort;
        sort.column = $scope.columns[index].field;
        sort.order === 'asc' ? sort.order = 'desc' : sort.order = 'asc';
        //not sure
        self.refreshTable();
        //insted of this this.setDataProvider(setDataProvider);
    };
    this.isSelectedRow = function (obj, index) {
        $scope.selectedRow === index ? $scope.selectedRow = null : $scope.selectedRow = index;
        if ($attrs.selected) {
            $scope.selected = obj;
        }
    };
    this.contentInserting = function (parent, elemString) {
        var element = angular.element(elemString);
        angular.element(parent).html('');
        angular.element(parent).append(element);
        $compile(element)($scope);
    };
    this.getColumnsArray = function (array, result) {
        result = result || [];
        array.forEach(function (item, i, arr) {
            item.subColumns.length > 0 ? self.getColumnsArray(array[i].subColumns, result) : result.push(array[i]);
        });
        return result;
    };
    this.addClickedChild = function ($event) {
        var clickedObj = {
            value: $event.target.attributes['criteriy-value'].value,
            field: $event.target.attributes['criteriy-field'].value
        }
        
        var finded = _.find(clickedChild, clickedObj);
        if (!finded) {
            clickedChild.push(clickedObj);
        }
        else {
            _.remove(clickedChild, clickedObj);
        }
        /*Refresh everything*/
        self.loadData(false);
        self.createNewParameters(false);
        self.contentInserting('.grid-table', generateMarkupGridProvider.main($scope.columns, $scope.visibleColumns, $scope.columnDropArray));
        $scope.selectedRow = null;
    };
    this.groupChild = {
        displayOrRemove: function (index, childMarkup, element) {
            var childElements = angular.element(".child-tr-" + index),
                childElem = angular.element(childMarkup);

            if (childElements.length == 0) {
                childElem.insertAfter(element);
                $compile(childElem)($scope);
            } else {
                childElements.remove();
            }
        },
        openLevelChild: function (parent, $event, index, line) {
            $event.stopPropagation();
            console.log(parent);
            var ChildsStr = '',
                element = angular.element($event.target),
                childElements = element.children("div");

            element.hasClass('group-tree-opened') ? element.removeClass('group-tree-opened') : element.addClass('group-tree-opened');

            /*Checking if it is last element in child tree*/
            if (childElements.length > 0) {
                console.log(childElements[0]);
                for (var i = 0, j = childElements.length; i < j;i++){
                    var childElem = angular.element(childElements[i]);

                    if (childElem.hasClass("display-block")) {
                        childElem.removeClass("display-block").addClass("display-none");
                        this.displayOrRemove(index, ChildsStr, element);
                    }
                    else {
                        childElem.removeClass("display-none").addClass("display-block");
                    }
                }
            } else {

                /*Creating markup html for child element*/
                line.child.forEach(function (item, i, arr) {
                    var childLine = '<td class="grid-item"></td>';
                    $scope.columns.forEach(function (col, i, columns) {
                        for (var prop in item) {
                            if (prop == col.field && !$scope.visibleColumns[col.title]) {
                                childLine += '<td class="grid-item">' + item[prop] + '</td>';
                            }
                        }
                    });
                    ChildsStr += '<tr class="child-tr-appended child-tr-' + index + '" ng-class="{\'grid-line-item\': true}">' + childLine + '</tr>';
                });
                console.log(ChildsStr);
                /*Append generated markup of top line parent element*/
                this.displayOrRemove(index, ChildsStr, this.findAppendParent(element));
            }
        },
        findAppendParent: function (element) {
            var parent = angular.element(element)[0].parentElement;

            if (parent.className.includes("grid-line-item")) {
                return angular.element(parent);
            }
            else {
                return self.groupChild.findAppendParent(parent);
            }
        },
        clearChild: function (element) {
            console.log(element);
            var child = angular.element(element.children("div")[0]);

            if (element.children("div").length > 0) {
                this.clearChild(child);
            }
            if (child.hasClass('display-block')) {
                child.removeClass('display-block').addClass("display-none");
            }
            if (child.hasClass('group-tree-opened')) {
                child.removeClass('group-tree-opened');
            }
            
        }
    }
    this.createNewParameters = function (isDraged) {
        if (isDraged) {
            findChangingElements = { isFounded: false, length: 0 };
            $scope.columnsGroup = self.columnsGroupChangePlaces(self.dragAndDrop, $scope.columnsGroup);
        }
        $scope.treeList = self.creatingTreeList($scope.columnsGroup);
        $scope.columns = self.getColumnsArray($scope.columnsGroup);
    };
    this.dragAndDrop = {
        values: {},
        Handler: function (type, row, cell, id, isColumn, title) {
            if (typeof type === 'string') {
                this.values[type] = {
                    row: row,
                    cell: cell,
                    id: id,
                    isColumn: isColumn,
                    title:title
                };
            }

            var drop = this.values.drop,
                drag = this.values.drag;
            /*If we have correct drag,drop data - rebuild everything*/
            if ((drop && drag) && (drop !== null && drag !== null) && (drop.id !== drag.id)) {    
                self.createNewParameters(true);
                self.contentInserting('.grid-header', generateMarkupGridProvider.header($scope.treeList, $scope.columns));
                self.contentInserting('.grid-table', generateMarkupGridProvider.main($scope.columns, $scope.visibleColumns, $scope.columnDropArray));

                this.values.drop = null;
                this.values.drag = null;
            }
        },
        columnDrop: function ($event) {
            var obj = this.values.drag;
            if (obj.isColumn) {
                this.addColumnDrop(obj.title, obj);
                self.refreshTable();
            }
            else {
                Notification.error({ message: 'You tried to drag not the column', title: 'Error', positionY: 'top', positionX: 'right', delay: 4000 });
            }
        },
        addColumnDrop: function (title, obj) {
            var isInsertedBefore = false;
            $scope.columnDropArray.forEach(function (item, i, arr) {
                if (item.id === obj.id && item.title === obj.title) {
                    isInsertedBefore = true;
                }
            });
            $scope.columns.forEach(function (item, i, arr) {
                if (item.title === obj.title) {
                    obj.field = item.field;
                }
            });
            !isInsertedBefore ? $scope.columnDropArray.push(obj) : Notification({ message: 'You column are here!', title: 'Hmmm', positionY: 'top', positionX: 'right', delay: 4000 });
        },
        deleteColumnDrop: function (index, title) {
            var notVisibleColumns = $scope.columnDropArray.splice(index, $scope.columnDropArray.length - index);
            notVisibleColumns.forEach(function (item, i, arr) {
                if (notVisibleColumns[item.title]) {
                    notVisibleColumns[item.title] = false;
                }
            });
            self.refreshTable();  
        }
    };
    this.refreshTable = function () {
        self.loadData(false);
        self.createNewParameters(false);
        self.contentInserting('.grid-header', generateMarkupGridProvider.header($scope.treeList, $scope.columns));
        self.contentInserting('.grid-table', generateMarkupGridProvider.main($scope.columns, $scope.visibleColumns, $scope.columnDropArray));
        $scope.selectedRow = null;
    };
    this.hasChild = function (item) {
        var number = 0;
        columnsHere = self.getColumnsArray(item.subColumns);

        columnsHere.forEach(function (item, i, arr) {
            for (var key in $scope.visibleColumns) {
                if ((key === item.title) && $scope.visibleColumns[key] === true) {
                    number++;
                }
            }
        });

        return columnsHere.length > number;
    };
    this.findDepth = function (tree, depth, level) {
        depth = depth || 0;
        level = level || 0;

        level++;
        depth = Math.max(level, depth);

        tree.forEach(function (item, i) {

            if (item.subColumns.length > 0) {
                depth = Math.max(self.findDepth(item.subColumns, depth, level), depth);
            }
        });
        return depth;
    };
    this.creatingTreeList = function (group, result, level) {
        var child,
            previousCollSum,
            coll = [];

        level = level || 0;
        level++;

        if (!result) {
            result = {
                depth: self.findDepth(group),
                array: []
            };
            $scope.columns.forEach(function () {
                result.array.push([]);
            });
        }
        group.forEach(function (item, i) {
            if (item.subColumns.length > 0) {
                child = self.creatingTreeList(item.subColumns, result, level);
                previousCollSum = 0;
                child.forEach(function (item, i, arr) {
                    previousCollSum += item.colspan;
                });

                if (self.hasChild(item)) {
                    coll.push({
                        colspan: previousCollSum,
                        level: level,
                        isHasMenu: false,
                        item: item,
                        _id: level.toString() + (result.array[result.depth - level].length + i),
                        channel: level.toString() + result.array[result.depth - level].length
                    });
                }
            }
            else {
                if (!$scope.visibleColumns[item.title]) {
                    coll.push({
                        colspan: 1,
                        level : level,
                        isHasMenu: true,
                        item: item,
                        _id: level.toString() + (result.array[result.depth - level].length + i),
                        channel: level.toString() + result.array[result.depth - level].length
                    });
                }
            }
        });

        var currentRowIdx = result.depth - level,
            resultArray = result.array;

        resultArray[currentRowIdx] = resultArray[currentRowIdx].concat(coll);

        if (level === 1) {
            resultArray.forEach(function (row) {
                row.forEach(function (item, i, cell) {
                    item.rowspan = cell[i].item.subColumns.length > 0 ? 1 : result.depth - item.level + 1;
                });
            });
            result.array.reverse();
            if ($scope.columnDropArray.length > 0) {
                result.array[0].unshift({
                    colspan: 1,
                    level: 1,
                    rowspan: result.depth,
                    item: {
                        title: 'Group',
                        subColumns:[]
                    }
                });
            }
            return result.array;
        } else {
            return coll;
        }
    };
    this.columnsGroupChangePlaces = function (dragAndDrop, columns, level) {
        var help,
            row = dragAndDrop.values.drop.row,
            dropCell = dragAndDrop.values.drop.cell,
            dragCell = dragAndDrop.values.drag.cell,
            before = findChangingElements.length,
            numVisibleColumns;
        level = level || 0;
        level++;

        if (level === dragAndDrop.values.drop.row + 1 && !findChangingElements.isFounded) {
            if ((columns.length >= row) && (columns[dropCell - before] && columns[dragCell - before])) {
                /*swap the values of two variables*/
                columns[dropCell - before] = [columns[dragCell - before], columns[dragCell - before] = columns[dropCell - before]][0];
                findChangingElements.isFounded = true;
            }
            else {
                numVisibleColumns = 0;
                for (var prop in $scope.visibleColumns) {
                    if($scope.visibleColumns[prop]){
                        numVisibleColumns++;
                    }
                }
                findChangingElements.length += columns.length - numVisibleColumns;
            }
        }

        columns.forEach(function (item, index, array) {
            if (item.subColumns.length > 0) {
                self.columnsGroupChangePlaces(self.dragAndDrop, item.subColumns, level);
            }
        });

        return columns;
    };

    $scope.$watch('visibleColumns', function (newValue, oldValue) {
        $scope.visibleColumns = newValue;
        self.refreshTable();
    }, true);

    (function tableScroll() {
        var parrentEl = angular.element('.grid-scrolltable'),
            childEl = angular.element('.grid-scrolltable-child');

        parrentEl.on('scroll', function () {
            var element = this;
            childEl.scrollLeft(parrentEl.scrollLeft());
            
            parrentEl.scrollTop() !== 0 ? scroll.y = parrentEl.scrollTop() : parrentEl.scrollTop(scroll.y);
            if (parrentEl.scrollLeft() !== 0) {
                    scroll.x = parrentEl.scrollLeft();
            }
            else {
                if (scroll.x > 20) {
                    parrentEl.scrollLeft(scroll.x);
                }
            }
            if ((element.scrollTop / (element.scrollHeight - element.clientHeight)) > 0.99) {
                self.loadMore();
            }
        });
    }());
}])
.directive('collumns', function () {
    return {
        restrict: 'E',
        require: ["^grid", "collumns"],
        controller: "columnGroupController",
        link: function (scope, element, attr, ctrl) {
            ctrl[0].setCollumnsProvider({
                getCollumns: function () {
                    return ctrl[1].getColumn();
                }
            });
        }
    };
})
.directive('columnGroup', function () {
    return {
        restrict: 'E',
        require: ["^collumns", "?^^columnGroup", "columnGroup"],
        scope: {
            title: "@",
            innertree: "="
        },
        controller: "columnGroupController",
        link: function (scope, element, attr, ctrl) {
            (ctrl[1] || ctrl[0]).add({ title: scope.title, subColumns: ctrl[2].getColumn() });
        }
    };
})
.controller('columnGroupController', ['$scope', function Controller($scope) {
    var columns = [];
    this.add = function (obj) {
        columns.push(obj);
    }
    this.getColumn = function () {
        return columns;
    }
}])
.directive('collumn', function () {
    return {
        restrict: 'E',
        require: ["^collumns", "collumn", "?^^columnGroup"],
        scope: {
            field: "@",
            title: "@"
        },
        controller: "collumnController",
        link: function (scope, element, attr, ctrl) {
            var res = {
                field: scope.field,
                title: scope.title,
                menu: ctrl[1].getCollumnMenuArray(),
                subColumns: []
            };
            (ctrl[2] || ctrl[0]).add(res);
        }
    };
})
.controller('collumnController', function Controller() {
    var collumnMenuArray = [];
    this.addCollumnMenuArray = function (menuList) {
        collumnMenuArray.push(menuList);
    };
    this.getCollumnMenuArray = function () {
        return collumnMenuArray[0];
    };
})
.controller('menuListController', function Controller() {
    var menuListArray = [];
    this.addMenuList = function (menu) {
        menuListArray.push(menu);
    };
    this.getMenuList = function () {
        return menuListArray;
    };
})
.directive('menuList', function () {
    return {
        restrict: 'E',
        replace: true,
        require: ["^collumn", "menuList"],
        controller: "menuListController",
        link: function (scope, element, attr, ctrl) {
            ctrl[0].addCollumnMenuArray(ctrl[1].getMenuList());
        }
    };
})
.directive('menuItem', function () {
    return {
        restrict: 'E',
        replace: true,
        require: "^menuList",
        scope: {
            text: "@",
            code: "@"
        },
        link: function (scope, element, attr, ctrl) {
            ctrl.addMenuList({
                text: scope.text,
                code: scope.code
            })
        }
    };
})
.directive('arrayData', function ($q) {
    return {
        restrict: 'E',
        replace: true,
        require: "^grid",
        scope: {
            data: "="
        },
        link: function (scope, element, attr, ctrl) {
            ctrl.setDataProvider({
                getData: function (collumn, order) {
                    var data = _.sortBy(scope.data, collumn);
                    if (order) {
                        data.reverse();
                    }
                    return $q.when(data);
                }
            });
            scope.$watch('data', function (newValue, oldValue) {
                ctrl.refreshData();
            }, true);
        }
    };
})
.directive('httpData', function ($q, $http) {
    return {
        restrict: 'E',
        replace: true,
        require: "^grid",
        scope: {
            pageSize: "=",
            url: "@"
        },
        link: function (scope, element, attr, ctrl) {
            var lenght = 0,
                allLoaded = false,
                canceler = $q.defer(),
                cancel = function () {
                    canceler.resolve("user cancelled");
                    canceler = $q.defer();
                };

            ctrl.setDataProvider({
                getData: function (data) {
                    cancel();

                    if (data.next && allLoaded) {
                        return $q.when([]);
                    }

                    if (!data.next) {
                        lenght = 0;
                        allLoaded = false;
                    }

                    var deferred = $q.defer();

                    $http.post(scope.url, {
                        column: data.sort.column,
                        order: data.sort.order,
                        filter: data.filter,
                        startIndex: lenght, endIndex: lenght + scope.pageSize
                    },
                    {
                        headers: { 'Content-Type': 'Application/json' },
                        timeout: canceler.promise
                    }).then(function (response) {

                        if (response.data.lenght == 0) {
                            allLoaded = true;
                        }

                        lenght += response.data.length;
                        deferred.resolve(response.data);

                    });

                    return deferred.promise;
                },
                pageSize: scope.pageSize
            });
        }
    };
});
/*
Sorting : Number.
[   
    {  
        "Id":null,
        "Number":8,
        "Text1":null,
        "Text2":null,
        "Text3":null,
        "child":[  
           {  
               "Id":98,
               "Number":8,
               "Text1":"Hammer142",
               "Text2":"Hardware232",
               "Text3":"Something642"
           },
           {  
               "Id":68,
               "Number":8,
               "Text1":"Hammer932",
               "Text2":"Hardware2832",
               "Text3":"Something7932"
           }
        ]
    }
]

But if sorting: Number+Personal Key.
[  
   {  
       "Id":null,
       "Number":8,
       "Text1":"Hammer142",
       "Text2":null,
       "Text3":null,
       "child":[  
          {  
              "Id":98,
              "Number":8,
              "Text1":"Hammer142",
              "Text2":"Hardware232",
              "Text3":"Something642"
          }
       ]
   },
   {  
       "Id":null,
       "Number":8,
       "Text1":"Hammer932",
       "Text2":null,
       "Text3":null,
       "child":[  
          {  
              "Id":68,
              "Number":8,
              "Text1":"Hammer932",
              "Text2":"Hardware2832",
              "Text3":"Something7932"
          }
       ]
   }
]
*/
/*groupArray.forEach(function (groupElement, i, arr) {
                       if (i == 0) {
                           sortedArray = self.grouping(data, [groupElement]);
                       }
                       if (i > 0) {
                           sortedArray = self.groupLastChild(sortedArray, groupElement);
                       }
                   });
deferred.resolve(sortedArray);
});
return deferred.promise;
},
createTree: function (array, groupArray) {

},
groupClever: function (data, groupArray) {
    var stringSorting = '',
        sortedArray,
        uniqGroupElement; 

    groupArray.forEach(function (line, i, arr) {
        stringSorting += groupArray[i].field;
        if (i + 1 !== arr.length) {
            stringSorting += ' ';
        }
    });
    sortedArray = _.sortBy(data, stringSorting);
                
    return sortedArray;
} 
groupLastChild: function (array, groupElem) {
    var self = this;

    if (!array[0].child) {
        var result = (self.grouping(array, [groupElem]));
        array = [];
        result.forEach(function (item, i, arr) {
            array.push(item);
        });
        return array;
    }
    else {
        array.forEach(function (item, i, array) {
            item.child = self.groupLastChild(item.child, groupElem);
        });
    }
    return array;
},
grouping: function (data, groupArray) {
    var sortedArray = [];
    sortedArray = _.uniqBy(data, function (obj) {
        var strReturn = '';
        groupArray.forEach(function (line, i, arr) {
            strReturn += obj[groupArray[i].field];
            if (i !== arr.length) {
                strReturn += ' ';
            }
        });
        return strReturn;
    });

    sortedArray = _.cloneDeep(sortedArray);

    sortedArray.forEach(function (item, i, arr) {
        var isLine;
        for (var prop in item) {
            isLine = false;
            groupArray.forEach(function (line, i, arr) {
                if (prop === line.field) {
                    isLine = true;
                }
            });
            if (!isLine) {
                item[prop] = null;
            }
        }

        item.child = [];
        data.forEach(function (line, i, arr) {
            var childPropCount = 0;
            for (var prop in line) {
                if (line[prop] === item[prop]) {
                    childPropCount++;
                }
            }
            if (childPropCount === groupArray.length) {
                item.child.push(line);
            }
        });

    });
    return sortedArray;
}*/