/*
 * Copyright (C) 2009 Viewer
 *
 * This file is part of Viewer
 *
 * Viewer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Viewer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Viewer.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @requires Viewer/windows/BaseWindow.js
 */

Ext.namespace('Viewer');

/**
 * Class: Viewer.LoadWmcWindow
 *      Window to load WMS layers in map application
 *
 * Inherits from:
 *  - {Viewer.BaseWindow}
 */

/**
 * Constructor: Viewer.LoadWmcWindow
 * Create an instance of Viewer.LoadWmcWindow
 *
 * Parameters:
 * config - {Object} A config object used to set the addwmslayer
 *     window's properties.
 */
Viewer.LoadWmcWindow = function(config) {
    Ext.apply(this, config);
    Viewer.LoadWmcWindow.superclass.constructor.call(this);
};

Ext.extend(Viewer.LoadWmcWindow, Viewer.BaseWindow, {

    /**
     * Method: init
     *     Initialize this component.
     */
    initComponent: function() {
        Viewer.LoadWmcWindow.superclass.initComponent.call(this);

        Ext.QuickTips.init();

        this.title = "Load WMC File";

        this.width = 385;
        this.resizable = false;

        this.charset = "UTF-8";

        var fp = new Ext.FormPanel({
//            renderTo: 'form_wmc',
            fileUpload: true,
            width: 360,
            autoHeight:true,
            bodyStyle: 'padding: 10px 10px 0 10px;',
            labelWidth: 0,
            plain: true,
            frame: true,
            border: false,
            defaults: {
                anchor: '90%',
                msgTarget: 'side',
                allowBlank: false
            },
            items: [
                {
                    xtype: 'fileuploadfield',
                    id: 'form-file',
                    emptyText: "Select WMC File",
                    hideLabel : true,
                    buttonText: '',
                    name: 'Fileconten',
                    buttonCfg: {
                        text: '',
                        iconCls: 'selectfile'
                    }
                }
            ],
            buttons: [{
                text: "Load",
                scope: this,
                handler: function() {
                    if (fp.getForm().isValid()) {
                        fp.getForm().submit({
                            url: 'LoadWmc',
                            success: this.onSuccessLoad,
                            failure: this.onFailure,
                            scope: this
                        });
                    }
                }
            },{
                text: "Merge",
                scope: this,
                handler: function() {
                   if (fp.getForm().isValid()) {
                        fp.getForm().submit({
                            url: 'LoadWmc',
                            success: this.onSuccessMerge,
                            failure: this.onFailure,
                            scope: this
                        });
                    }
                }
            }]
        });

        this.add(fp);

        this.doLayout();
    },

    onSuccessLoad: function(form, action) {
        var json = action.response.responseText;
        var o = Ext.decode(json);
        if (o.success) {
            var cb = OpenLayers.Function.bind(this.parseWMCLoad, this);
            OpenLayers.loadURL(o.url, null, null, cb);
        } else {
            this.onAjaxFailure();
        }
    },

    onSuccessMerge: function(form, action) {
        var json = action.response.responseText;
        var o = Ext.decode(json);
        if (o.success) {
            var cb = OpenLayers.Function.bind(this.parseWMCMerge, this);
            OpenLayers.loadURL(o.url, null, null, cb);

        } else {
            this.onAjaxFailure();
        }
    },

    onFailure: function(form, action) {
         Ext.MessageBox.show({icon: Ext.MessageBox.ERROR,
                    title: OpenLayers.i18n("errorTitle"), msg:
                    OpenLayers.i18n("InvalidWMC"),
                    buttons: Ext.MessageBox.OK});
    },

    /**
     * parseWMCLoad
     * Load the WMC and close the dialog
     *
     * Parameters:
     * response - {<OpenLayers.Ajax.Response>}
    */
    parseWMCLoad: function(response)
    {
        Viewer.WMCManager.loadWmc(this.map, response.responseText);
        Ext.WindowMgr.getActive().close();
    },

    /**
     * parseWMCMerge
     * Merge the WMC and close the dialog
     *
     * Parameters:
     * response - {<OpenLayers.Ajax.Response>}
    */
    parseWMCMerge: function(response)
    {
        Viewer.WMCManager.mergeWmc(this.map, response.responseText);
        Ext.WindowMgr.getActive().close();
    }
});
