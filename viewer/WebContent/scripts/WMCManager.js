/*
 * there is a bug for format.read(xml, {map: map});
 * It reads layer with name from original layer's title
 */

Ext.namespace('Viewer', 'Viewer.WMC');

Viewer.WMC = function() {
    
    // public
    return {
        /**
         * APIMethod: loadWmc
         * Load in a Web Map Context document into the map.
         *
         * Parameters:
         * map - {<OpenLayers.Map>}
         * xml - {String} The Web Map Context XML string
         */
        loadWmc: function(map, xml) {
            try {
                var layers = map.layers;
                // remove all previous layers
                for(var i = layers.length-1; i > 0; i--) {
                    map.removeLayer(layers[i]);
                }
                activeNodes = [];
                
                Ext.getCmp('toctree').getRootNode().removeAll();

                var format = new OpenLayers.Format.WMC({'layerOptions': {buffer: 0}});
                // temp map
                var tmap = new OpenLayers.Map();
                format.read(xml, {map: tmap});
                mapPanel.doLayout();
                for(var i = 0; i < tmap.layers.length; ++i){
                	var layer = tmap.layers[i];
                	if(!layer.isBaseLayer)
                		{
                    	var layerParams = {format:'image/png', transparent:'TRUE'};
                    	var layerOptions = {ratio:1, singleTile: true, isBaseLayer: false};
                    	if(i === 0)
                    		layerOptions = OpenLayers.Util.extend(layerOptions, {visibility:true});
                    	else
                    		layerOptions = OpenLayers.Util.extend(layerOptions, {visibility:false});
                    	var wmsLayer = new OpenLayers.Layer.WMS( layer.name, layer.url,
                            {layers: 'geol', transparent:'TRUE'},
                            layerOptions);
                        if (layer.styles && layer.styles.length > 0) {
                            var style = layer.styles[0];
                            if (style.legend && style.legend.href) {
                                wmsLayer.legendURL = style.legend.href;
                            }
                        }
                       map.addLayer(wmsLayer);
                        var node = null;
                        if(i===0){
                        	node = new Ext.tree.TreeNode({layer: wmsLayer, text:
                            	wmsLayer.name, checked: true, leaf: true});
                        	wmsLayer.setVisibility(true);
                        	activeNodes.push(node);
                        }
                        else
                        	node = new Ext.tree.TreeNode({layer: wmsLayer, text:
                            	wmsLayer.name, checked: false, leaf: true});
                            
                        	//map.addLayer(layer);
                        	//doesn't work?
                        	root.appendChild(node);
                        	
                		}
                }
            } catch(err) {
                Ext.MessageBox.alert(OpenLayers.i18n("selectWMCFile.errorLoadingWMC"));
            }
        },

        /**
         * APIMethod: mergeWmc
         * Load in a Web Map Context document into the map and merge it
         * with existing layers.
         *
         * Parameters:
         * map - {<OpenLayers.Map>}
         * xml - {String} The Web Map Context XML string
         */
        mergeWmc: function(map, xml) {
            try {
                var format = new OpenLayers.Format.WMC({'layerOptions': {buffer: 0}});
                map = format.read(xml, {map: map});
            } catch(err) {
                Ext.MessageBox.alert(OpenLayers.i18n("selectWMCFile.errorLoadingWMC"));
            }
        },

        /**
         * APIMethod: saveContext
         * Save the map as a Web Map Context document (uses server-side Java)
         *
         * Parameters:
         * map - {<OpenLayers.Map>}
         */
        saveContext: function(map) {
            var wmc = new OpenLayers.Format.WMC();

            OpenLayers.Request.POST({
                // TODO: there were problems with relative 
                // urls, should we change this?
                url:  "WmcCreateServlet",
                data: wmc.write(map),
                success: this.onSaveContextSuccess,
                failure: this.onSaveContextFailure
            });
        },

        /**
         * Method: onSaveContextSuccess
         * Success AJAX handler for saving WMC.
         *
         * Parameters:
         * response - {Object} The response object
         */
        onSaveContextSuccess: function(response) {
            var json = response.responseText;
            var o = Ext.decode(json);
            if (o.success) {
                window.open(o.url);
            } else {
                this.onSaveContextFailure();
            }
        },

        /**
         * Method: onSaveContextFailure
         * Failure AJAX handler for saving WMC.
         *
         * Parameters:
         * response - {Object} The response object
         */
        onSaveContextFailure: function(form, action) {
            Ext.MessageBox.show({icon: Ext.MessageBox.ERROR,
                title: OpenLayers.i18n("saveWMCFile.windowTitle"), msg:
                OpenLayers.i18n("saveWMCFile.errorSaveWMC"),
                buttons: Ext.MessageBox.OK});
        }

    };
};

Viewer.WMCManager = new Viewer.WMC();
