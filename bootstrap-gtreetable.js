/* =========================================================
 * GTreeTableEx
 * bootstrap-gtreetable.js 1.3
 * =========================================================
 * Copyright 2014 avtonomspb@mail.ru
 * Copyright 2014 Maciej "Gilek" Kłak http://gtreetable.gilek.net
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.  
 * ========================================================= */

!function($) {
    var GTreeTable = function(element, options) {

        this.options = $.extend({},$.fn.gtreetable.defaults, options);

        var lang = this.options.languages[this.options.language] === undefined ?
                this.options.languages['en_US'] :
                this.options.languages[this.options.language];

        if (this.options.template === undefined) {
        
            var template = '<table class="table gtreetable">' +
                '<tr class="node node-collapsed">' +
                '<td>' +
                    '<span>';
                    
            if (this.options.draggable===true) {
                template += '<span class="node-handle">&zwnj;</span>';
            }        
                    
            template +=  '<span><span class="node-indent"></span>' +
                '<i class="node-icon glyphicon glyphicon-chevron-right"></i><i class="node-icon-selected glyphicon glyphicon-ok"></i>' +
                '<span class="hide node-action">' +
                '<input type="text" name="name" value="" style="width: '+ this.options.inputWidth +'" class="form-control" />' +
                '<button type="button" class="btn btn-sm btn-primary node-save">' + lang.save + '</button> ' +
                '<button type="button" class="btn btn-sm node-saveCancel">' + lang.cancel + '</button>' +
                '</span>' +
                '<span class="node-name"></span> <span class="node-badge badge">?</span><span class="node-descr"></span></span>' +
//                  '<div class="panel panel-default"><div class="panel-body node-name"></div><div class="panel-footer node-descr"></div></div>' +
                '<span class="hide row node-move">' +
                '<span class="col-sm-9">' +
                '<span class="input-group">' +
                '<input type="text" class="form-control" placeholder="' + lang.parent_id + '" />' +
                '<span class="input-group-btn">' +
                '<button class="btn btn-default node-moveSave" type="button">' + lang.actionMove + '</button>' +
                '</span>' +
                ' </span>' +
                '</span>' +
                '</span>' +
                '<div class="btn-group pull-right">' +
                '<button type="button" class="btn btn-sm btn-default dropdown-toggle node-actions" data-toggle="dropdown">' +
                lang.action + ' <span class="caret"></span>' +
                '</button>' +
                '<ul class="dropdown-menu" role="menu">' +
                '<li role="presentation" class="dropdown-header">' + lang.action + '</li>';

            this.actions = new Array();
            if (this.options.defaultActions!==null)
                this.actions = this.options.defaultActions;

            if (this.options.actions!==undefined)
                this.actions.push.apply(this.actions, this.options.actions);

            $.each(this.actions, function(index,action) {
                var matches = action.name.match(/\{(.+)\}/);
                var name = matches!==null && matches[1]!==undefined && lang[matches[1]]!==undefined ? lang[matches[1]] : action.name;
                template += '<li role="presentation"><a href="#notarget" class="node-action-'+index+'" tabindex="-1">' + name + '</a></li>';
            });

            template += '</ul>' +
                '</div>' +
                '</td>' +
                '</tr>' +
                '</table>';
            this.options.template = template;
        }

        this.cache = new Array();

        this.tree = element;
        if (!this.tree.find('tbody').length === 0)
            this.tree.append('<tbody></tbody>');

        if (!this.options.readonly) {
            this.tree.addClass('gtreetable-fullAccess');
        }

        this.nodeTemplate = $(this.options.templateSelector ? this.options.templateSelector : this.options.template).find('.node');
    };

    GTreeTable.prototype = {
        init: function(id) {
            this.fillNodes(id === undefined ? 0 : id, this);
        },
        getNode: function(id) {
            return this.tree.find('.node' + id);
        },         
        getNodeLastChild: function(parentId) {
            var last = undefined;
            $.each(this.getNode(parentId).nextAll('.node'), function(key, node) {
                var node = $(node);
                if (node.data('parent')===parentId) {
                    last = node;
                } else {
                    return last;
                }
            });
            return last;

        },
        getSelectedNodes: function() {
            return this.tree.find('.node-selected');
        },        
        getNodePath: function(node) {
            var path = [node.find('.node-name').html()]
                , parent = node.data('parent');
                
            node.prevAll('.node').each(function() {
                var $this = $(this);
                if ($this.data('id')===parent) {
                    parent = $this.data('parent');
                    path[path.length] = $this.find('.node-name').html();
                }
            });
            return path;            
        },  
        renderNode: function(data) {
            var self = this;
            var node = self.nodeTemplate.clone(false);
            node.find('.node-name').html(data.name);
            if (data.id !== undefined) {
                node.data('id', data.id);
                node.addClass('node' + data.id);
                node.addClass('node-saved');
                if (parseInt(data.level)>=1)
                    node.addClass('node-draggable');
            }
            node.data('name', data.name);
            node.data('parent', data.parent);
            var parent = this.getNode(data.parent);
            node.data('level', (data.level !== undefined) ? data.level : parent.data('level')+1);
            node.data('descr', (data.descr !== undefined) ? data.descr : null);
            node.data('count_children', (data.count_children !== undefined && data.count_children !== null) ? data.count_children : null);
            node.find('.node-badge').html( node.data('count_children') );

            node.find('.node-indent').css('marginLeft', (parseInt(data.level) * self.options.nodeIndent) + 'px');
            margin = parseInt(node.data('level')) * self.options.nodeIndent;
            node.find('.node-descr').css('marginLeft', (margin) + 'px').html( node.data('descr') );
            node.find('.node-indent').css('marginLeft', margin + 'px').html('&zwnj;');

            node.mouseover(function() {
                $(this).addClass('node-hovered');
            });

            node.mouseleave(function() {
                $(this).removeClass('node-hovered');
                $(this).find('.btn-group').removeClass('open');
            });

            node.find('.node-name').click(function() {
                var node = $(this).parents('.node');
                var nodeData = {
                    id: node.data('id'),
                    path: self.getNodePath(node)
                };
                if(node.hasClass('node-selected')) {
                    if ($.isFunction(self.options.onUnselect)) {
                        self.options.onUnselect(node, nodeData, self);
                    }
                    node.removeClass('node-selected');
                } else {
                    var selectedNodes = self.getSelectedNodes();
                    if (self.options.multiselect===false) {
                        selectedNodes.removeClass('node-selected');
                    } else {
                        if (!isNaN(self.options.multiselect) && self.options.multiselect === self.getSelectedNodes().length) {
                            if ($.isFunction(self.options.onSelectOverflow)) {
                                self.options.onSelectOverflow(node, nodeData, self);
                            }                            
                            return;
                        }
                    }
                    
                    node.addClass('node-selected');

                    if ($.isFunction(self.options.onSelect)) {
                        self.options.onSelect(node, nodeData, self);
                    }                    
                }
            });

            node.find('.node-move').click(function() {
                self.$tree.find('.node-selected').removeClass('node-selected');
                var node = $(this).parents('.node');

                if ($.isFunction(self.options.onSelect)) {
                    self.options.onSelect(node, self);
                }
            });

            if(node.data('count_children')>0){
                node.find('.node-icon').click(function(e) {
                    if (node.hasClass('node-collapsed'))
                        self.expandNode(data.id, {
                            isAltPressed: e.altKey
                        });
                    else
                        self.collapseNode(data.id);
                });
            } else {
                node.find('.node-icon').css('visibility', 'hidden');
            }

            $.each(this.actions, function(index,action) {
                node.find('.node-action-'+index).click(function() {
                    action.event(node,self);
                });
            });

            node.find('.node-save').click(function() {
                self.saveNode(node);
            });

            node.find('.node-saveCancel').click(function() {
                self.saveCancelNode(node);
            });

            node.find('.node-moveSave').click(function() {
                self.moveSaveNode(node);
            });

            return node;
        },
        appendNode: function(node) {
            if (this.tree.find('.node').length === 0)
                this.tree.append(node);
            else {
                var last = this.getNodeLastChild(node.data('parent'));
                if (last === undefined)
                    last = this.getNode(node.data('parent'))

                last.after(node);
            }
        },
        addNode: function(node) {
            var self = this;
            node.find('.node-icon').css('visibility', 'visible');
            var newNode = self.renderNode({
                'level': parseInt(node.data('level')) + 1,
                'parent': node.data('id')
            });
            newNode.find('.node-action').removeClass('hide');
            self.expandNode(newNode.data('parent'), {
                'onAfterFill': function(self) {
                    self.appendNode(newNode);
                }
            });
        },
        updateNode: function(node) {
            var nodeName = node.find('.node-name');
            node.find('input').val(node.data('name'));
            nodeName.addClass('hide');
            node.find('.node-action').removeClass('hide');
        },
        removeNode: function(node) {
            var self = this;
            if (node.hasClass('node-saved')) {
                if ($.isFunction(self.options.onDelete))
                    $.when(self.options.onDelete(node)).done(function(data) {
                        delete self.cache[node.data('parent')];
                        if (!(node.prev('.node').data('parent') === node.data('parent') || node.next('.node').data('parent') === node.data('parent')))
                            self.collapseNode(node.data('parent'));
                        else
                            self._removeNode(node.data('id'));
                    });
            } else {
                node.remove();
            }

        },
        moveNode: function(node) {
            node.find('.node-move')
                .removeClass('hide')
                .focus();
        },
        moveSaveNode: function(node) {
            var self = this;
            if ($.isFunction(self.options.onMove))
                $.when(self.options.onMove(node)).done(function(data) {
                    var nodeMove = node.find('.node-move');
                    nodeMove.addClass('hide');
                });
        },
        _removeNode: function(id) {
            this.removeChildNodes(id);
            this.getNode(id).remove();

        },
        removeChildNodes: function(id) {
            var parent = this.getNode(id);
            var child = parent.nextAll('.node');
            for (var y in child) {
                var node = $(child[y]);
                if (node.data('level') > parent.data('level'))
                    node.remove();
                else
                    break;
            }
        },
        saveNode: function(node) {
            var self = this;
            if ($.isFunction(self.options.onSave))
                $.when(self.options.onSave(node)).done(function(data) {
                    delete self.cache[node.data('parent')];
                    var nodeAction = node.find('.node-action');
                    node.find('.node-name').html(nodeAction.find('input').val()).removeClass('hide');
                    nodeAction.addClass('hide');
                    if (!node.hasClass('node-saved')) {
                        node.data('id', data.id);
                        node.addClass('node' + data.id);
                        node.addClass('node-saved');
                        node.addClass('node-draggable');
                    }
                });
        },
        saveCancelNode: function(node) {
            if (node.hasClass('node-saved')) {
                node.find('.node-action').addClass('hide');
                node.find('.node-name').removeClass('hide');
            } else {
                var parent = this.getNode(node.data('parent'));
                if (node.prev('.node').data('parent') === parent.data('id'))
                    node.remove();
                else
                    this.collapseNode(parent.data('id'));
            }
        },
        collapseNode: function(id) {
            this.removeChildNodes(id);
            this.getNode(id).removeClass('node-expanded').addClass('node-collapsed');
        },
        expandNode: function(id, options) {
            var node = this.getNode(id);
            if (!node.hasClass('node-expanded')) {
                this.getNode(id).removeClass('node-collapsed').addClass('node-expanded');
                this.fillNodes(id, options);
            } else
            if (options && typeof options.onAfterFill==='function')
                options.onAfterFill(this);
        },
        fillNodes: function(parentId, options) {
            var self = this;
            if (self.options.cache && self.cache[parentId] && !options.isAltPressed) {
                self._fillNodes(parentId, options);
            } else {
                $.when(self.getSourceNodes(parentId, self)).done(function(data) {
                    self._fillNodes(parentId, options);
                });
            }
        },
        _fillNodes: function(parentId, options) {
            for (x = 0; x < this.cache[parentId].length; x++) {
                var node = this.renderNode(this.cache[parentId][x]);
                var cache = this.cache[node.data('id')];
                if (cache && cache.length === 0 && !options.isAltPressed)
                    node.find('.node-icon').css('visibility', 'hidden');
                this.appendNode(node);
            }
            if (options && typeof options.onAfterFill==='function')
                options.onAfterFill(this);

            var parent = this.getNode(parentId);
            if (parent.next('.node').data('parent') !== parentId)
                parent.find('.node-icon').css('visibility', 'hidden');

        },
        getSourceNodes: function(parentId, self) {
            return $.ajax({
                type: 'GET',
                url: self.options.source(parentId),
                dataType: 'json',
                beforeSend: function() {
                    self.getNode(parentId).find('.node-name').addClass(self.options.loadingClass);
                },
                success: function(nodes) {
                    if(!self.isArray(nodes)){
                        throw new Error('Input data is not array!');
                    }
                    for (x = 0; x < nodes.length; x++)
                        nodes[x].parent = parentId;
                    self.cache[parentId] = nodes;
                },
                error: function(XMLHttpRequest) {
                    alert(XMLHttpRequest.status + ': ' + XMLHttpRequest.responseText);
                },
                complete: function() {
                    self.getNode(parentId).find('.node-name').removeClass(self.options.loadingClass);
                }
            });
        },
        isArray: function(inputArray) {
            return inputArray && !(inputArray.propertyIsEnumerable('length')) && typeof inputArray === 'object' && typeof inputArray.length === 'number';
        }
    };

    $.fn.gtreetable = function(option) {
        if(typeof option === "string" && option==="selectedId") {
            var ids = [],
                obj = $(this).data('gtreetable');
        
            $.each(obj.getSelectedNodes(),function(key, node) {
                ids.push($(node).data('id'));
            });
            return (obj.options.multiselect===false) ? ids[0] : ids;
        }        

        return this.each(function() {
            var $this = $(this)
                    , obj = $this.data('gtreetable');

            if (!obj) {
                if ($this[0].tagName === 'TABLE') {
                    var obj = new GTreeTable($(this), option);
                    $this.data('gtreetable', obj);
                    obj.init();
                }
            }                
        });
    };

    $.fn.gtreetable.defaults = {
        nodeIndent: 16,
        language: 'en_US',
        languages: {
            en_US: {
                save: 'Save',
                cancel: 'Cancel',
                action: 'Action',
                actionAdd: 'Add',
                actionEdit: 'Edit',
                actionDelete: 'Delete',
                parent_id: 'Parent ID',
                actionMove: 'Move'
            }
        },
        defaultActions: [
            {
                name: '{actionAdd}',
                event: function(node, object) {
                    object.addNode(node);
                }
            },
            {
                name: '{actionEdit}',
                event: function(node, object) {
                    object.updateNode(node);
                }
            },
            {
                name: '{actionDelete}',
                event: function(node, object) {
                    object.removeNode(node);
                }
            } ,
            {
                name: '{actionMove}',
                event: function(node, object) {
                    object.moveNode(node);
                }
            }
        ],
        loadingClass: 'node-loading',
        inputWidth: '60%',
        readonly: false,
        cache: true,
        draggable: false
    };
}(jQuery);
