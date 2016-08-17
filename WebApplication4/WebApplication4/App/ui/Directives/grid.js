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
        if (columnDropArray.length === 0) {
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
        Row += '<td class="grid-item" ng-class="{\'last-item\':line.lastItem==true}" ng-click="!line.lastItem && ctrl.addClickedChild($event)" criteriy-value="{{line[\'groupValue\']}}" criteriy-field="{{line[\'groupName\']}}" criteriy-level="{{line[\'level\']}}" ng-style="{\'left\':5*line[\'level\']}">{{line["groupValue"]}}</td>';
        col.forEach(function (item, i, arr) {
            if (visibleColumns[item.title]) {
                Row += '';
            }
            else if (typeof visibleColumns[item.field] === "undefined" || visibleColumns[item.field] === false) {
                Row += '<td class="grid-item">{{line["' + item.field + '"]}}</td>';
            }
        });

        return '<tbody vs-repeat vs-scroll-parent=".grid-scrolltable">\
                <tr ng-repeat="line in arrayList track by $index" ng-class="{\'grid-line-item\': true, \'group-tree-opened\':line.opened==true, \'group-tree\':!line.opened}" >\
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
            values = [],
            clicked = [];
        return {
            setClicked:function(clickedArray){
                clicked = clickedArray;
            },
            getClicked: function () {
                if (clicked.length > 0) {
                    clicked.forEach(function (click, i, arr) {
                        if (click.parent) {
                            click.parent = false;
                        }
                    });
                }
                return clicked;
            },
            setGroupAndValues: function (groupBy, val) {
                groupList = groupBy;
                values = val;
            },
            getGroup:function(){
                return groupList;
            },
            getValues:function(){
                return values;
            },
            getData: function (сonfigData) {
                var groupArray = this.getGroup(),
                    values = this.getValues(),
                    clicked = this.getClicked();
                    self = this,
                    deferred = $q.defer(),
                    notClosingCols = ['groupValue', 'groupName', 'opened', 'level', 'child'];
                    
                    provider.getData(сonfigData).then(function (data) {
                        //ALERT for testing
                        data[1].Text1 = "Hammer91";
                        data[2].Text1 = "Hammer91";
                        data[3].Text1 = "Hammer91";
                        data[12].Number = 45;

                        if (groupArray.length == 0) {
                            deferred.resolve(data);
                            return deferred.promise;
                        }

                        /*if have grouping*/
                        var stringSorting = '',
                            sortedArray = [],
                            uniqueArray = [],
                            sortedClicked = [],
                            groupLength = groupArray.length;
                        /*add to notCloingCols if we have some values*/
                        values.forEach(function (item, i, arr) {
                            notClosingCols.push(item.title);
                        });
                        
                        /*creating unique base of elements*/
                        uniqueArray = _.uniqBy(data, groupArray[0].field.toString());
                        uniqueArray = _.cloneDeep(uniqueArray);
                        uniqueArray.forEach(function (item, i, arr) {
                            item.groupValue = item[groupArray[0].field];
                            item.groupName = groupArray[0].field;
                            item.level = 0;
                        });

                        
                        /*sort all opening rows by level value*/
                        sortedClicked = _.sortBy(clicked, 'level');

                        /*Insertion opened elements*/
                        sortedClicked.forEach(function(itemOnLevel, itemIndex, level){
                            var childs = [],
                                index = null;

                            data.forEach(function (item, i, arr) {
                                if (item[itemOnLevel.field] == itemOnLevel.value) {
                                    var item = _.cloneDeep(item),
                                        level = parseInt(itemOnLevel.level) + 1,
                                        insBefore = false;

                                    if (level <= groupArray.length) {                                      
                                        item.level = level;

                                        /*if not inserted before(if in some level we have group)*/
                                        childs.forEach(function(child, i, arr){
                                            if(groupArray[level] && child[groupArray[level].field] == item[groupArray[level].field]){
                                                insBefore = true;
                                            }
                                        });
                                        if (!insBefore) {
                                            childs.push(item);
                                        }
                                    }
                                }
                            });

                            uniqueArray.forEach(function (item, i, arr) {
                                if (item[itemOnLevel.field] == itemOnLevel.value) {
                                    index = i;
                                }
                            });

                            uniqueArray.splice.apply(uniqueArray, [index + 1, 0].concat(childs));
                        });

                        /*Child for every elem*/
                        uniqueArray.forEach(function (uniq, i, arr) {
                            var groupParameters,
                                searchingObj = {};
                            if (uniq.level < groupArray.length) {
                                groupParameters = groupArray.slice(0, uniq.level+1); 
                            }
                            else {
                                groupParameters = groupArray;
                            }
                            //Lets create searchingObj
                            groupParameters.forEach(function (param, i, arr) {
                                searchingObj[param.field] = uniq[param.field];
                            });
                            uniq.child = _.cloneDeep(_.filter(data, searchingObj));
                        });
                        /*Handling values*/
                        values.forEach(function (value, i, arr) {
                            switch (value.values) {
                                case 'first':
                                    break;
                                case 'last':
                                    uniqueArray.forEach(function (item, i, arr) {
                                        if (item.level !== groupArray.length) {
                                            item[value.field] = item.child[item.child.length - 1][value.field];
                                        }
                                    });
                                    break;
                                case 'avg':
                                    uniqueArray.forEach(function (item, i, arr) {
                                        var sum = null;
                                        item.child.forEach(function (ch, i, arr) {
                                            sum += parseInt(ch[value.field]);
                                        });
                                        if (item.level !== groupArray.length) {
                                            item[value.field] = sum / item.child.length;
                                        }
                                    });
                                    break;
                                case 'count':
                                    uniqueArray.forEach(function (item, i, arr) {
                                        if (item.level !== groupArray.length) {
                                            item[value.field] = item.child.length;
                                        }
                                    });
                                    break;
                                case 'max':
                                    uniqueArray.forEach(function (item, i, arr) {
                                        var max = null;
                                        item.child.forEach(function (ch, i, arr) {
                                            if ( parseInt(ch[value.field]) > max || max === null ) {
                                                max = parseInt(ch[value.field]);
                                            }
                                        });
                                        if (item.level !== groupArray.length) {
                                            item[value.field] = max;
                                        }
                                    });
                                    break;
                                case 'min':
                                    uniqueArray.forEach(function (item, i, arr) {
                                        var min = null;
                                        item.child.forEach(function (ch, i, arr) {
                                            if (parseInt(ch[value.field]) < min || min === null) {
                                                min = parseInt(ch[value.field]);
                                            }
                                        });
                                        if (item.level !== groupArray.length) {
                                            item[value.field] = min;
                                        }
                                    });
                                    break;
                                case 'sum':
                                    uniqueArray.forEach(function (item, i, arr) {
                                        var sum = null;
                                        item.child.forEach(function (ch, i, arr) {
                                            sum += parseInt(ch[value.field]);
                                        });
                                        if (item.level !== groupArray.length) {
                                            item[value.field] = sum;
                                        }
                                    });
                                    break;
                                case 'zero':
                                    uniqueArray.forEach(function (item, i, arr) {
                                        if (item.level !== groupArray.length) {
                                            item[value.field] = 0;
                                        }
                                    });
                                    break;
                                default:
                                    alert('I dont know that values - ', value);
                            }
                        });

                        function findChildElements(elem) {
                            var childs = [];
                            data.forEach(function (item, i, arr) {

                            });
                            //childs = _.takeWhile(data, function (o) { return !o.active; });
                            return childs;
                        }
                        /*What data display in rows*/
                        uniqueArray.forEach(function (item, i, arr) {
                            /*if it is last element(display everything but not group)*/
                            if (item.level === groupLength) {
                                item.lastItem = true;
                                item.groupValue = item.groupName = null;
                            }

                            /*if element is not the last and it is opened*/
                            else if (item.level > 0 && arr[i + 1].level > item.level) {
                                item = displayMiddleElem(item, groupArray);
                                item.opened = true;
                            }

                            /*if element not last in tree and it is not opened*/
                            else if (item.level > 0) {
                                item = displayMiddleElem(item, groupArray);
                            }

                            /*if element is first and not opened*/
                            else if (item.level == 0) {
                                for (var prop in item) {
                                    var display = _.indexOf(notClosingCols, prop);
                                    if (display === -1) {
                                        item[prop] = null;
                                    }
                                }
                                if (arr[i + 1] && (arr[i + 1].level > item.level)) {
                                    item.opened = true;
                                }
                            }

                            function displayMiddleElem(item, groupArray) {
                                item.groupName = groupArray[item.level].field;
                                item.groupValue = item[groupArray[item.level].field];
                                for (var prop in item) {
                                    var display = _.indexOf(notClosingCols, prop);
                                    if (display === -1) {
                                        item[prop] = null;
                                    }
                                }
                                return item;
                            }
                        });
                        deferred.resolve(uniqueArray);
                    });
                return deferred.promise;
            }
        };
    }    
})
.controller('TableController', ['$scope', '$attrs', '$compile', 'Notification', "groupDataProvider", "generateMarkupGridProvider", "$timeout", function Controller($scope, $attrs, $compile, Notification, groupDataProvider, generateMarkupGridProvider, $timeout) {
    $scope.columns = [];
    $scope.visibleColumns = {};
    $scope.arrayList = [];
    $scope.selectedRow = null;
    $scope.sort = {
        column: 'Number',
        order: 'asc'
    };
    $scope.columnDropArray = [];
    $scope.columnValues = [];
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
        setDataProvider.setGroupAndValues($scope.columnDropArray, $scope.columnValues);
        setDataProvider.setClicked(clickedChild);
        setDataProvider.getData({ filter: filter, sort: $scope.sort, next: isAppend }).then(function (data) {
            $scope.arrayList = isAppend ? $scope.arrayList.concat(data) : data;
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
        self.refreshTable();
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
        $event.stopPropagation();
        var clickedObj = {
            value: $event.target.attributes['criteriy-value'].value,
            field: $event.target.attributes['criteriy-field'].value,
            level: $event.target.attributes['criteriy-level'].value
        }
        
        var finded = _.find(clickedChild, clickedObj);
        if (!finded) {
            clickedChild.push(clickedObj);
        }
        else {
            /*remove children*/
            var index = _.findIndex(clickedChild, clickedObj);
            if (clickedChild[index + 1] && clickedChild[index + 1].level > clickedChild[index].level) {
                _.remove(clickedChild, clickedChild[index + 1]);
            }

            /*remove element*/
            _.remove(clickedChild, clickedObj);
            
        }

        /*Refresh everything*/
        self.loadData(false);
        self.createNewParameters(false);
        self.contentInserting('.grid-table', generateMarkupGridProvider.main($scope.columns, $scope.visibleColumns, $scope.columnDropArray));
        $scope.selectedRow = null;
    };
    this.createNewParameters = function (isDraged) {
        if (isDraged) {
            findChangingElements = { isFounded: false, length: 0 };
            $scope.columnsGroup = self.columnsGroupChangePlaces(self.dragAndDrop, $scope.columnsGroup);
        }
        $scope.treeList = self.creatingTreeList($scope.columnsGroup);
        $scope.columns = self.getColumnsArray($scope.columnsGroup);
    };
    this.columnValue = {
        open: function (obj, e, indexOpened) {
            var options = ['avg', 'count', 'first', 'last', 'max', 'min', 'sum', 'zero'],
                optionString = '',
                elementContext = '';

            this.indexOpened = indexOpened;

            options.forEach(function (item, i, arr) {
                optionString += '<li style="cursor:pointer;" ng-click="ctrl.columnValue.changeValue(\''+item+'\',$event)">' + item + '</li>';
            });

            elementContext = '<div style="background: #2e9292;box-sizing: border-box;font-family: Arial;color: #f0eceb; position: absolute;width: 120px;height: 100px;overflow-x: hidden;"><ul><li style="height:0px; list-style: none;"><input type="text" class="inputForFocus" style="height:0px; border:none; width:0;"/></li>' + optionString + '</ul></div>';
 
            divForInner = angular.element(elementContext);
            insertedElement = angular.element(e.target).append(divForInner);
            $compile(divForInner)($scope);

            /*focus in hidden input*/
            insInput = divForInner.find('.inputForFocus').focus();
            insInput.focusout(function () {
                $timeout(function () {
                    divForInner.remove();
                }, 200);
            });
        },
        indexOpened: null,
        changeValue: function (name, e) {
            e.stopPropagation();
            if (this.indexOpened !== null) {
                $scope.columnValues[this.indexOpened].values = name;
                this.indexOpened = null;
                self.refreshTable();
            }
        }
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
        addValue:function ($event) {
            var obj = this.values.drag;
            var title = obj.title,
                isInsertedBefore = false;

            if (obj.isColumn && obj.title==="Number") {

                $scope.columnValues.forEach(function (item, i, arr) {
                    if (item.id === obj.id && item.title === obj.title) {
                        isInsertedBefore = true;
                    }
                });

                $scope.columns.forEach(function (item, i, arr) {
                    if (item.title === obj.title) {
                        obj.field = item.field;
                    }
                });

                /*first init values*/
                obj.values = 'first';
                !isInsertedBefore ? $scope.columnValues.push(obj) : Notification({ message: 'You column are here!', title: 'Hmmm', positionY: 'top', positionX: 'right', delay: 4000 });
                self.refreshTable();
            }
            else {
                Notification.error({ message: 'You tried to drag not the column or Column value is not number', title: 'Error', positionY: 'top', positionX: 'right', delay: 4000 });
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
        },
        deleteValueDrop: function (index, title) {
            var notVisibleColumns = $scope.columnValues.splice(index, $scope.columnValues.length - index);
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