/*
 *   Document   : init.js
 *   Created on : Sep 2, 2012, 11:28:27 AM
 *   Updated: Mar 21, 2013
 *   Author     : kai liu
 *   Based on: GeoNetwork viewer
 */

Ext.namespace('Viewer');

var mapPanel, tree, map, addWmsWin, form, opcityWin,  nodeOverlays_Folder, zoomSelector, combo, leftPanel, root, options;
var activeNodes = [];
var tabMetadataItems = [];
var simplemode = false;
var select = null;
var bProj = true;							
var mode = 'simple';
var baselayer;
var viewerport ;
var lurl = document.URL;
var wmclayers = [];
// simple array store of projection
var store = new Ext.data.ArrayStore({
    fields: ['name', 'projection'],
    data : [
    ],
    autoLoad:false
});

var optionlst = [{
    			//projection: new OpenLayers.Projection("EPSG:3857"),
                	displayProjection: "EPSG:4326",
            		numZoomLevels: 18,
           		maxExtent: new OpenLayers.Bounds(
        			-20037508.34,
        			-20037508.34,
        			20037508.34,
        			20037508.34
           		 )
		},{
	        	//projection: new OpenLayers.Projection("EPSG:4326"),
	        	numZoomLevels: 18,
	    		maxExtent: new OpenLayers.Bounds(-180, -90, 180, 90),
		     	units: "degrees"
	    	},{
	    	 	//projection: new OpenLayers.Projection("EPSG:3571"),
	    	 	units: "m",
	         	numZoomLevels: 18,
	         	maxResolution: 80092,
	        	maxExtent: new OpenLayers.Bounds(-12741629.065420,-12741629.065420,12741629.065420,12741629.065420),
	         	restrictedExtent:new OpenLayers.Bounds(-12741629.065420,-12741629.065420,12741629.065420,12741629.065420)
	    	}
	    ];

var baselayerlst = [new OpenLayers.Layer.XYZ(
		            "OpenStreetMap", 
		            [
		                "http://otile1.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png",
		                "http://otile2.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png",
		                "http://otile3.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png",
		                "http://otile4.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png"
		            ],
		            {
		                    transitionEffect: "resize",   
			            buffer: 0,
			            sphericalMercator: true
		            }),
                    new OpenLayers.Layer.WMS("OpenLayers WMS",
                            "http://vmap0.tiles.osgeo.org/wms/vmap0",
                            {layers: 'basic'}, {
                                buffer: 0,
                                visibility: true,
                                isBaseLayer: true
                            }
                            ),
                    new OpenLayers.Layer.WMS("ETOPO1",
  			            		  "http://184.72.218.254/geoserver/arctic_sdi/wms", {
  			            	  layers: "ETOPO1"
  			              }, {
  			            	  buffer: 0,
  			            	  visibility: true,
  			            	  isBaseLayer: true
  			              })            
                            ];

var projlst = [["EPSG:3857","EPSG:900913"], ["CRS:84","EPSG:4326"],["EPSG:3571", "EPSG:3572","EPSG:3573","EPSG:3574","EPSG:3575","EPSG:3576"]];

// Create new Projection for the map
function reproject(map, newProjection, noZoom)
{
    if (map.projection != newProjection.projCode) {
        map.baseLayer.options.scales = map.scales;
        var oldProjection = map.getProjectionObject();
        map.projection = newProjection.projCode;
        if (newProjection.getUnits() === null) {
            map.units = 'degrees';
        } else {
            map.units = newProjection.getUnits();
        }
        // make sure the cursor pos control shows coordinates with the
        // right precision
        var cursorPos = null;
        if (map.getControlsByClass('Viewer.Control.CursorPos').length > 0) {
            cursorPos = map.getControlsByClass('Viewer.Control.CursorPos')[0];
        }
        if (map.units == 'm' && cursorPos !== null) {
            cursorPos.numdigits = 0;
        } else if (map.units == 'degrees' && cursorPos !== null) {
            cursorPos.numdigits = 4;
        }

        map.maxExtent = map.maxExtent.transform(oldProjection,
            newProjection);
        map.baseLayer.extent = map.maxExtent;

        //        var bounds = map.getExtent().transform(oldProjection,
        //            newProjection);

        var bounds = map.maxExtent;
       
        var zoom = map.getZoom();
       
        for (var i=0; i< map.layers.length; i++) {
            var layer = map.layers[i];
            layer.units = map.units;
            layer.projection = newProjection;
            layer.maxExtent = map.maxExtent;

            if (layer.isBaseLayer) {
                layer.initResolutions();
            } else {
                // just copy it from the baselayer
                layer.resolutions =  map.baseLayer.resolutions;
                layer.minResolution = map.baseLayer.minResolution;
                layer.maxResolution = map.baseLayer.maxResolution;
            }
            if (layer instanceof OpenLayers.Layer.Vector) {
                for (var j=0; j < layer.features.length; j++) {
                    var feature = layer.features[j];
                    if (feature.geometry.projection != map.projection) {
                        feature.geometry.transform(
                            new OpenLayers.Projection(
                                feature.geometry.projection),
                            map.getProjectionObject() );
                        feature.geometry.projection  = map.projection;
                    }
                }
            }
            layer.redraw();
        }
        if (!noZoom) {
        //            map.zoomToExtent(bounds);
        //            map.zoomTo(zoom);           
        }
    }
};

//remove the activeNodes layer from a map
function removeLayerHandler(node) {
    if (typeof node !== 'undefined') {
        var layer;
        layer = node.attributes.layer;
        if (layer) {
            if (!layer.isBaseLayer) {
                if ((typeof(layer.isLoading) == "undefined") ||  // Layers added from WMC
                    (layer.isLoading == false)) {
                    map.removeLayer(layer);
                    activeNodes.splice(activeNodes.indexOf(node),1);
                   
                    //Ext.getCmp('legendwms').forceRemoveLegend(node.attributes.layer.id);
//                    if (activeNodes == node) activeNodes = null;
                    var parentNode = node.parentNode;
                    node.remove(true);                                  
                    if (!parentNode.hasChildNodes()) {
                        parentNode.set('leaf', true);
                    }
                   
                    refreshTocToolbar(activeNodes);
//                    Ext.getCmp('toctree').getSelectionModel().clearSelections();
                }
            }
        }
    }
};
   
function zoomlayer(layer){
        
        	var curlayer = layer;
            if (curlayer) {
                if ( curlayer.llbbox) {
                    // store info as wgs84
                    var mapProj = map.getProjectionObject();
                    var wgs84 = new OpenLayers.Projection("EPSG:4326");
                    var llbbox = curlayer.llbbox;
                    var minMapxy = new OpenLayers.LonLat(llbbox[0], llbbox[1]).transform(wgs84, mapProj);
                    var maxMapxy = new OpenLayers.LonLat(llbbox[2], llbbox[3]).transform(wgs84, mapProj);
                    //-20037508, -20037508,20037508, 20037508
                    var extent = new OpenLayers.Bounds();
                    extent.left = minMapxy.lon;
                    extent.right = maxMapxy.lon;
                    extent.top = maxMapxy.lat;
                    extent.bottom = minMapxy.lat;

                    map.zoomToExtent(extent);

                // If layer has no boundingbox info, use full extent
                } else {
                    map.zoomToMaxExtent();
                }
            } else {
                Ext.MessageBox.alert("NoSeletedLayer",
                    "Please select layer to zoom");
            }
        } 

function addKMLfromURL(kmlurl){
	var kmlLayer = new OpenLayers.Layer.Vector("KML", {
		  projection: new OpenLayers.Projection("EPSG:4326"),
		    strategies: [new OpenLayers.Strategy.Fixed()],
		    protocol: new OpenLayers.Protocol.HTTP({
		        url: "GetRemoteService?url="+kmlurl+"&servicetype=kml",
		        format: new OpenLayers.Format.KML({
		            extractStyles: true, 
		            extractAttributes: true,
		            maxDepth: 2
		        })
		    })
		});
	map.addLayer(kmlLayer);
	select = new OpenLayers.Control.SelectFeature(kmlLayer);
	kmlLayer.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    map.addControl(select);
    select.activate(); 
	var kmlname = decodeURIComponent(kmlurl);
    var node = new Ext.tree.TreeNode({layer: kmlLayer, text:
    	kmlname, checked: true, leaf: true});
    root.appendChild(node);
};

function onPopupClose(evt) {
    select.unselectAll();
}

function onFeatureSelect(event) {
    var feature = event.feature;
    // Since KML is user-generated, do naive protection against
    // Javascript.
    var content = "<h2>"+feature.attributes.name + "</h2>" + feature.attributes.description;
    if (content.search("<script") != -1) {
        content = "Content contained Javascript! Escaped content below.<br>" + content.replace(/</g, "&lt;");
    }
    popup = new OpenLayers.Popup.FramedCloud("chicken", 
                             feature.geometry.getBounds().getCenterLonLat(),
                             new OpenLayers.Size(100,100),
                             content,
                             null, true, onPopupClose);
    feature.popup = popup;
    map.addPopup(popup);
}

function onFeatureUnselect(event) {
    var feature = event.feature;
    if(feature.popup) {
        map.removePopup(feature.popup);
        feature.popup.destroy();
        delete feature.popup;
    }
}

function addKMZfromURL(kmzurl){
	var kmzLayer = new OpenLayers.Layer.Vector("KML", {
		  projection: new OpenLayers.Projection("EPSG:4326"),
		    strategies: [new OpenLayers.Strategy.Fixed()],
		    protocol: new OpenLayers.Protocol.HTTP({
		        url: "Kmztokml?url="+kmzurl,
		        format: new OpenLayers.Format.KML({
		            extractStyles: true, 
		            extractAttributes: true,
		            maxDepth: 4
		        })
		    })
		});
	map.addLayer(kmzLayer);
	select = new OpenLayers.Control.SelectFeature(kmzLayer);
	kmzLayer.events.on({
        "featureselected": onFeatureSelect,
        "featureunselected": onFeatureUnselect
    });
    map.addControl(select);
    select.activate(); 
	var kmzname = decodeURIComponent(kmzurl) ;
    var node = new Ext.tree.TreeNode({layer: kmzLayer, text:
    	kmzname, checked: true, leaf: true});
    root.appendChild(node);
};

Ext.onReady(function() {

	//If we have options, we can initialize the map
    function setmap(options, baselayer){
         map =new OpenLayers.Map('map', options);
         map.addLayer(baselayer);
    }

    // if true a google layer is used, if false
    // the bluemarble WMS layer is used

    //Register windows in WindowManager
	//default base layers
      
    //root node of the left tree which shows the baselayer and added map services
    root = new Ext.tree.TreeNode({
        expanded: true, // allow children autoload, and thus layers 
    }); 
    
    // the childern nodes of root  
    // it is a folder
    // advanced mode
    nodeOverlays_Folder = new Ext.tree.TreeNode({text:
        "Overlays", cls: "folder",
        expanded: true});
    
    var nodeBase_Folder = new Ext.tree.TreeNode({text:
        "Base Layer", cls: "folder",
        expanded: true});
    
	//rerpojection
    var repro = false;
    
    //parse the url
    //http://localhost:8080/viewer/?url=http://mrdata.usgs.gov/services/copper-smelters&servicetype=wms
    try
    {
    	var uri = new Uri(location.search);
    	//revised the jsUri to case insensitive
    	var tmpurls = uri.getQueryParamValue('url');
    	var urls= typeof tmpurls === 'undefined'?[]:tmpurls.split(',');
    	var tmpStypes = uri.getQueryParamValue('servicetype');
        if(typeof tmpStypes !== 'undefined')
                tmpStypes = tmpStypes.toUpperCase();
    	var serviceTypes=typeof tmpStypes === 'undefined'?[]:tmpStypes.split(',');
    	if(urls.length !== serviceTypes.length){
    	    Ext.MessageBox.show({
    	        title: 'Waring',
    	        msg: "Number of url doesn't match servicetype",
    	        buttons: Ext.MessageBox.OK,
    	        icon: Ext.MessageBox.WARNING
    	    });
    	    urls = [];
    	    serviceTypes = [];
    	}
        if(urls.length==0){
                options =  OpenLayers.Util.extend({projection: "EPSG:3857"},optionlst[0]);
	        baselayer = baselayerlst[0];
                setmap(options,baselayer);
                setViewer();
        }
    	// mode
    	var tmpmode=uri.getQueryParamValue('mode');
    	if(typeof tmpmode === 'undefined')
    		mode = 'simple';
    	else if(tmpmode.toUpperCase() === 'SIMPLE')
    		mode = 'simple';
    	else if(tmpmode.toUpperCase() === 'ADVANCED')
    		mode = 'advanced';
    	else{
    	    Ext.MessageBox.show({
    	        title: 'Waring',
    	        msg: "Mode should be simple or advanced! Return to use simple mode",
    	        buttons: Ext.MessageBox.OK,
    	        icon: Ext.MessageBox.WARNING
    	    });
    	    mode = 'simple';
    	}
    	
	//find the projection 
	// 1) if user set the projection in the URL
	function getProjIndex(proj){
		for(var i1 = 0; i1 < projlst.length; ++i1){
			for(var i2 = 0; i2 < projlst[i1].length; ++i2){
				if(projlst[i1][i2] === proj){                   //check if we can find the initProj in projlst
					return i1;
				}
			}
			// If we can't fined the projection in proj list
		}
		return 0;
 	};

	var initProj=uri.getQueryParamValue('srs');
    	if(typeof initProj !== 'undefined'){
		var i = getProjIndex(initProj);
		options =  OpenLayers.Util.extend({projection:initProj},optionlst[i]);
		baselayer = baselayerlst[i];
    		//If there is no Mercator or 4326?
    	}
	// 2) if there is kml or kmz in the URL, 
	// We should use EPSG3857
	if(serviceTypes.indexOf("KML")>=0||serviceTypes.indexOf("KMZ")>=0){
		options =  OpenLayers.Util.extend({EPSG:3857},optionlst[0]);
		baselayer = baselayerlst[0];
	}
	
	if(typeof map === 'undefined' && typeof options !== 'undefined'){
		setmap(options,baselayer);
                setViewer();
	}
    	// try to find the common projection
    	//var responselst = [];
    	var proj_all_services = [];
    	var wmslst = [], metadatalst = [];
    	var getmaplst = []; // for those url which contians request=getmap
    	var projfromGetMap; //Get the first one if there are more than 1 GetMap
    	var bMercator = false;
    	var b4326 = false;
    	
        //add layer from getmap request
        function addLayerFromGetMap(turi){
	     var layers = turi.getQueryParamValue('LAYERS');
	     if(typeof layers === 'undefined')
	             return;
	     else{
	             var wms = new OpenLayers.Layer.WMS(layers, 
                     turi.toString().split('?')[0], {
						layers: layers, 
						format:'image/png',
						transparent:'TRUE'
					},{
						ratio:1,
						visibility: true
					});
		      map.addLayer(wms);
	           }
         } 
    	// we need to know the projection from WMS
    	for(var i=0, len = urls.length; i < len; i++){
    		var tmptype = serviceTypes[i].toUpperCase();
    		if(tmptype === 'WMS'){
    			var wmsgetmapuri = new Uri(decodeURIComponent(urls[i]));
    			var request = wmsgetmapuri.getQueryParamValue('request');
    			projfromGetMap = wmsgetmapuri.getQueryParamValue('CRS');
    			if(typeof request !== 'undefined' && request.toUpperCase() === 'GETMAP'){
    			     if(typeof options === 'undefined'){
                                 // GetMapRequest always have SRS
                                 var projFromGetMap =  wmsgetmapuri.getQueryParamValue('srs').toUpperCase();
                                 var i = getProjIndex(initProj);
                                 options =  OpenLayers.Util.extend({projection:initProj},optionlst[i]);
                                 baselayer = baselayerlst[i];
                                 if(typeof map === 'undefined' && typeof options !== 'undefined'){
		                     setmap(options,baselayer);
	                         }
                             }
                             addLayerFromGetMap(wmsgetmapuri);
    			}else{
                        Ext.Ajax.request({
                    	url:  "GetRemoteService",
                        params:{url:encodeURIComponent(decodeURIComponent(urls[i])),servicetype:serviceTypes[i]},
                        method: 'GET',
                        failure: function(response){
                            //if it failed, use EPSG:3857
                            options =  OpenLayers.Util.extend({projection:"EPSG:3857"},optionlst[i]);
                            baselayer = baselayerlst[i];
                            if(typeof map === 'undefined' && typeof options !== 'undefined'){
		                     setmap(options,baselayer);
                                     setViewer();
	                    }
                    	    Ext.MessageBox.show({
                	        title: 'Waring',
                	        msg: "Could not get service from input url",
                	        buttons: Ext.MessageBox.OK,
                	        icon: Ext.MessageBox.WARNING
                    	    });
                        },
                        success: function(response){
                          var parser = new OpenLayers.Format.WMSCapabilities();
                          var caps = parser.read(response.responseXML || response.responseText);
                          var srs=caps.capability.layers[0].srs;
                           for(var name in srs) {
                              proj_all_services.push(name);
                          }
                      	   proj_all_services = proj_all_services.filter(function(elem, pos) {
                    	    return proj_all_services.indexOf(elem) == pos;
                          	});
                           //the default selected Proj is 3857
                           var selectedProj;
                    	   for(var i=0, len = proj_all_services.length; i < len; i++){
                            //store.add(new store.recordType({
                            // 	name: proj_all_services[i],
                            // 	projection:proj_all_services[i]
                            // 	}));
                            if(proj_all_services[i].toUpperCase() === "EPSG:3857" || proj_all_services[i].toUpperCase() === "EPSG:90013") {
                                  selectedProj = proj_all_services[i].toUpperCase();
                                  break;
                            }
                            }
                    	   if(typeof selectedProj === 'undefined'){
                    		   for(var i=0, len = proj_all_services.length; i < len; i++){
                                   if(proj_all_services[i].toUpperCase() === "CRS:84" ||  proj_all_services[i].toUpperCase() === "EPSG:4326") {
                                         selectedProj = "EPSG:4326";
                                         break;
                                   }
                                   } 
                    	   }
                    	   if(typeof selectedProj=== 'undefined'){
                    		   selectedProj = "EPSG:3857";
                    	   }
                             //3) if options still be undefined, we should use the proj from wms
                            if(typeof map === 'undefined' && typeof options === 'undefined'){
                                  var i = getProjIndex(selectedProj);
		                  options =  OpenLayers.Util.extend({projection:selectedProj},optionlst[i]);
		                  baselayer = baselayerlst[i];
                                  setmap(options,baselayer);
                                  setViewer();
                            }

                            metadatalst.push(response.responseText);
                            wmslst.push(caps);
                            addwms(caps);
                    }});
    			}

    		}
    	}
    	    	
    	for(var i=0, len = urls.length; i < len; ++i){
    		if(serviceTypes[i].toUpperCase() === "KML"){
    			addKMLfromURL(urls[i]);
    		}
    		else if(serviceTypes[i].toUpperCase() === "KMZ"){
    			addKMZfromURL(urls[i]);
    		}
    	}
    }catch(err)
    {
		    Ext.MessageBox.show({
	        title: 'Waring',
	        msg: "There is error in URL",
	        buttons: Ext.MessageBox.OK,
	        icon: Ext.MessageBox.WARNING
	    });
	    urls = [];
	    serviceTypes = [];
    }
    //add layer from getmap request
    function addLayerfromGetMap(turi){
		var layers = turi.getQueryParamValue('LAYERS');
		if(typeof layers === 'undefined')
			return;
		else{
			var wmsLayer = new OpenLayers.Layer.WMS(layers, 
					turi.toString().split('?')[0], 
					{
						layers: layers, 
						format:'image/png',
						transparent:'TRUE'
					},{
						ratio:1,
						visibility: true
					});
			map.addLayer(wmsLayer);
                        zoomlayer(wmsLayer);

		}
    }
    //add all layers in the wms 
    function addwms(caps){
    	if(caps.capability){
    		for(var i = 0; i < caps.capability.layers.length; ++i){
        		var layer = caps.capability.layers[i];
        		if(layer.queryable === null)
        			return;
                var wmsLayer = null;     
                if (layer.name) {
                	layerParams = {format:'image/png', transparent:'TRUE'};
                	layerOptions = {ratio:1,  isBaseLayer: false};
                	layeroptions = OpenLayers.Util.extend({minScale: layer.minScale,
                        queryable: layer.queryable, maxScale: layer.maxScale,
                        metadataURL: layer.metadataURL,
                        dimensions: layer.dimensions,
                        styles: layer.styles,
                        llbbox: layer.llbbox},
                            layerOptions);

                	if(i === 0)
                    	layeroptions = OpenLayers.Util.extend(layeroptions, {visibility:true});
                	else
                		layeroptions = OpenLayers.Util.extend(layeroptions, {visibility:false});
                	wmsLayer = new OpenLayers.Layer.WMS( layer.title, caps.capability.request.getmap.href,
                        {layers: layer.name,  transparent:'TRUE'},
                        layeroptions);
                    if (layer.styles && layer.styles.length > 0) {
                        var style = layer.styles[0];
                        if (style.legend && style.legend.href) {
                            wmsLayer.legendURL = style.legend.href;
                        }
                    }
                   map.addLayer(wmsLayer);
                }
                if(i===0){
                	node =new Ext.tree.TreeNode({layer: wmsLayer, text:
            			layer.title,checked:true});
                	activeNodes.push(node);
                	zoomlayer(wmsLayer);
                }else{
                	node =new  Ext.tree.TreeNode({layer: wmsLayer, text:
            			layer.title,checked:false});
                }
                //node.addListener("click", this.click, this.scope);

   
        		//var node = addLayer(layer,caps.capability.request.getmap.href,null);
        		if(mode === 'simple'){
        			root.appendChild(node);
        		}
        		if(mode === 'advanced'){
//        		    root.appendChild(nodeBase_Folder);
//        		    root.appendChild(nodeOverlays_Folder);
        			root.appendChild(node);
        		}
        	}
    	}
    }
    
   });

function setViewer(){
 var zoomStore = new GeoExt.data.ScaleStore({
	  map: map
	  }); 
  
	var zoomSelector = new Ext.form.ComboBox({
        emptyText: 'Zoom level',
        tpl: '<tpl for="."><div class="x-combo-list-item">1 : {[parseInt(values.scale)]}</div></tpl>',
        editable: false,
        triggerAction: 'all',
        mode: 'local',
        store: zoomStore,
        width: 110
    });

    zoomSelector.on('click', function(evt){evt.stopEvent();});
    zoomSelector.on('mousedown', function(evt){evt.stopEvent();});
    zoomSelector.on('select', function(combo, record, index) {
        map.zoomTo(record.data.level);
        zoomSelector.setValue("1:"+record.data.scale);
    },zoomSelector);
    var zoomSelectorWrapper = new Ext.Panel({
        items: [zoomSelector],
        cls: 'overlay-element overlay-scalechooser',
        border: false,});
   
    var toolbarItems=[],action,actions=[],toctoolbar = [];  
   
    var simpletoolbarItems = [];
    // ZoomToMaxExtent control, a "button" control
    action = new GeoExt.Action({
        id: "zoomfull",
        control: new OpenLayers.Control.ZoomToMaxExtent(),
        map: map,
        iconCls:'zoomfull',
        tooltip:"Zoom Full",
        handler:function(){
           map.zoomToExtent(baselayer.maxExtent);
        }
    });
    actions["zoomfull"] = action;
    toolbarItems.push(action);
   
    simpletoolbarItems.push(action);
    action = new GeoExt.Action({
        id: "zoomlayer",
        map: map,
        iconCls:'zoomlayer',
        tooltip:"Zoom to layer",
        handler:function(){
            if (activeNodes.length >= 1) {
            	var curlayer = activeNodes[0].attributes.layer;
                if (curlayer) {zoomlayer(curlayer)} else {
                    Ext.MessageBox.alert("NoSeletedLayer",
                        "Please select layer to zoom");
                }
            } else {
                Ext.MessageBox.alert("NoSeletedLayer",
                "Please select layer to zoom");
            }
        }
    });
    
    actions["zoomlayer"] = action;
    toolbarItems.push(action);
    simpletoolbarItems.push(action);
    
    action = new GeoExt.Action({
        id: "zoomin",
        control: new OpenLayers.Control.ZoomBox(),
        toggleGroup: "move",
        map: map,
        iconCls:'zoomin',
        allowDepress: false,
        tooltip:"Zoom In"
    });
    actions["zoomin"] = action;
    toolbarItems.push(action);
   
    action = new GeoExt.Action({
        id: "zoomout",
        control:  new OpenLayers.Control.ZoomBox({
            displayClass: 'ZoomOut',
            out: true
        }),
        toggleGroup: "move",
        allowDepress: false,
        map: map,
        iconCls:'zoomout',
        tooltip:"Zoom Out"
    });
    actions["zoomout"] = action;
    toolbarItems.push(action);

    action = new GeoExt.Action({
    	control: new OpenLayers.Control.DragPan({
            isDefault: true
        }),
        toggleGroup: "move",
        allowDepress: false,
        map: map,
        toggleGroup: "move",
        iconCls:'pan',
        tooltip:"Pan"
    });
    actions["pan"] = action;
    toolbarItems.push(action);
    toolbarItems.push("-");
    
    simpletoolbarItems.push(action);
    
    // Navigation history - two "button" controls
    ctrl = new OpenLayers.Control.NavigationHistory();
    map.addControl(ctrl);
   

	    action = new GeoExt.Action({
	        id: "resultset_previous",
	        control: ctrl.previous,
	        map: map,
	        iconCls:'resultset_previous',
	        tooltip:"resultset_previous"
	    });
	    actions["resultset_previous"] = action;
	    toolbarItems.push(action);
   
    action = new GeoExt.Action({
        id: "resultset_next",
        control: ctrl.next,
        map: map,
        iconCls:'resultset_next',
        tooltip:"resultset_next"
    });
    actions["resultset_next"] = action;
    toolbarItems.push(action);
    toolbarItems.push("-");

   
    var featureinfo = new OpenLayers.Control.WMSGetFeatureInfo({drillDown: true, infoFormat: 'application/vnd.ogc.gml',            eventListeners: {
    }});

    featureinfolayer = new OpenLayers.Layer.Vector("Feature info", {displayInLayerSwitcher: false,
        styleMap: new OpenLayers.StyleMap({
            externalGraphic: OpenLayers.Util.getImagesLocation() + "marker.png",
            pointRadius: 12
        })
    });


    featureinfo.events.on({
        getfeatureinfo: function(evt) {
        	if (activeNodes.length >= 1) {
            	var curlayer = activeNodes[0].attributes.layer;
                if (curlayer&&curlayer.CLASS_NAME==="OpenLayers.Layer.WMS") {
                    if ( curlayer.llbbox) {
                        // store info as wgs84
                        var mapProj = map.getProjectionObject();
                        var wgs84 = new OpenLayers.Projection("EPSG:4326");
                        var llbbox = curlayer.llbbox;
                        var minMapxy = new OpenLayers.LonLat(llbbox[0], llbbox[1]).transform(wgs84, mapProj);
                        var maxMapxy = new OpenLayers.LonLat(llbbox[2], llbbox[3]).transform(wgs84, mapProj);

                        var extent = new OpenLayers.Bounds();
                        extent.left = minMapxy.lon;
                        extent.right = maxMapxy.lon;
                        extent.top = maxMapxy.lat;
                        extent.bottom = minMapxy.lat;
                        
                        var lonlat = map.getLonLatFromViewPortPx(evt.xy);
                        var point = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
                        var HEIGHT=500;
                        var WIDTH=500;
                        var x = (point.x- extent.left)/(extent.right - extent.left) * 500;
                        var y = 500 - (point.y- extent.bottom)/(extent.top - extent.bottom) * 500;
                        x = Math.floor(x);
                        y = Math.floor(y);
                        //'?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS=usa:states&QUERY_LAYERS=usa:states&STYLES=&BBOX='+BBOX+'&FEATURE_COUNT=5&HEIGHT='+HEIGHT+'&WIDTH='+WIDTH+'&FORMAT=image%2Fpng&INFO_FORMAT=text%2Fhtml&SRS=EPSG%3A4326&X='+X+'&Y='+Y;
                        var infourl = curlayer.url + "?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS="+curlayer.name+"&QUERY_LAYERS="+curlayer.name+"&STYLES=&BBOX="+llbbox+"&WIDTH=500&HEIGHT=500&SRS=EPSG%3A4326&X="+x+"&Y="+y;
                        
                      Ext.Ajax.request({
                    	url:  "GetRemoteService",
                        params:{url:infourl,servicetype:"wmsgetfeatureinfo"},
                        method: 'GET',
                        failure: function(response){
                            var text = response.responseText;
                        	Ext.MessageBox.alert("alert",
                                    response.responseText);
                            },
            
                        success: function(response){
                        	var feature =  response.responseText.replace(/\n/g,"<p>");
                        	Ext.MessageBox.alert("Feature Information",
                        			feature);
                            }
                    });
                       
                    // If layer has no boundingbox info, use full extent
                    } else {
                      
                    }
                } else  if (curlayer&&curlayer.CLASS_NAME==="OpenLayers.Layer.Vector"){
	               	
                }else{
                    Ext.MessageBox.alert("NoSeletedLayer",
                        "Please select layer to get feature information");
                }
            } else {
                Ext.MessageBox.alert("NoSeletedLayer",
                "Please select layer to get feature information");
            }
        },
        deactivate: function() {
            featureinfolayer.destroyFeatures();
        }
    });


    action = new GeoExt.Action({
    	control: featureinfo,
    	toggleGroup: "move",
        allowDepress: false,
        pressed: false,
        map: map,
        iconCls: 'query',
        tooltip: "Get Feature Information" 
    });
    actions["query"] = action;
    toolbarItems.push(action);
    
    toolbarItems.push("-");
    simpletoolbarItems.push(action);
    
    //Save the WMC
    action = new GeoExt.Action({
        id: "savewmc",
        map: map,
        iconCls:'savewmc',
        tooltip:"Save WMC",
        handler:function(){
            Viewer.WMCManager.saveContext(map);
        }
    });
    actions["savewmc"] = action;
    toolbarItems.push(action);
    
    Viewer.WindowManager.registerWindow("loadwmc", Viewer.LoadWmcWindow, {map: map, id:"loadwmc"});
    action = new GeoExt.Action({
        //id: "loadwmc",
        map: map,
        iconCls:'loadwmc',
        tooltip:"Load WMC",
        handler:function(){
            Viewer.WindowManager.showWindow("loadwmc");

        }
    });
    actions["loadwmc"] = action;
    toolbarItems.push(action);
    toolbarItems.push("-");

    //toolbarItems.push(zoomSelectorWrapper);
    toolbarItems.push("-");
    toolbarItems.push("->");
    
    combo = new Ext.form.ComboBox({
        store: store,
        displayField:'name',
        typeAhead: true,
        mode: 'local',
        triggerAction: 'all',
        selectOnFocus:true,
        value:map.projection,
        width:200,
        listeners:{
            select:function(combo,record,index){
                var strProjection = record.get('projection');             
                var newProjection = new OpenLayers.Projection(strProjection);
                reproject(map, newProjection, false);
               
            }
        }
    });
    
    actions["loadwmc"] = combo;
    toolbarItems.push(combo);

    var optMapPanel = {
        id:"mappanel",
        border:true,
        region:"center", 
        zoom:1,
        map:map,
        center: [0, 0]};
    
    map.zoomToMaxExtent();
    
    optMapPanel = mode == 'simple'?OpenLayers.Util.extend(optMapPanel,{tbar:simpletoolbarItems}):OpenLayers.Util.extend(optMapPanel,{tbar:toolbarItems});
    mapPanel = new GeoExt.MapPanel(optMapPanel);
    
    action = new GeoExt.Action({
        id: "addLayer",
        map: map,
        iconCls:'addLayer',
        tooltip:"Add layer",
        handler:function(){           
            addWmsWindow.show();
        }
    });
    toctoolbar.push(action);
   
    action = new GeoExt.Action({
        id:"tbRemoveButton",
        handler:function(){
            for(var i in activeNodes)
            {
                removeLayerHandler(activeNodes[i]);          
            }
        },
        iconCls:'deleteLayer',
        tooltip:"Remove layer"
    });
   
    toctoolbar.push(action);
    toctoolbar.push("-");
       
    action = new GeoExt.Action({
        id:"tbOpacityButton",
        handler:function(){
                var curlayer = activeNodes[0].attributes.layer;
                if (curlayer) {opacity(curlayer)} 
        },
        iconCls:'layerOpacity',
        tooltip:"Layer opacity"
    });
    toctoolbar.push(action);
   
    action = new GeoExt.Action({
        id:"tbBLayerOpacityButton",
        handler:function(){opacity(baselayer)},
        iconCls:'baselayeropacity',
        tooltip:"Base layer opacity"
    });
    
    function opacity(layer){
        var curlayer = layer;
        if (curlayer) {
                if ((typeof(curlayer.isLoading) == "undefined") ||  // Layers added from WMC
                    (curlayer.isLoading == false)) {
                    var slider = new GeoExt.LayerOpacitySlider({
                        layer: curlayer,
                        aggressive: true,
                        isFormField: true,
                        inverse: true,
                        fieldLabel: "opacity",
                        plugins: new GeoExt.LayerOpacitySliderTip({
                            template: '<div>Transparency: {opacity}%</div>'
                        })
                    });
                    opcityWin = new Ext.Window({
                        width:250,
                        height:50,
                        closeAction:'hide',
                        //               layout:"border",
                        title:"Opacity:"+curlayer.name,
                        items: [slider]
                    });
                    opcityWin.show(this);
                }
        } 

    }
    toctoolbar.push(action);
    toctoolbar.push("-"); 
   
    //Wms Information window
    //If there is an activeNodes, show its information
    action = new GeoExt.Action({
        id:"tbMetadataButton",
        handler:function(){
            // create a new WMS capabilities store
        	tabMetadataItems=[];
            try
            {
            	for(var i = 0, len = metadatalst.length; i < len; ++i){
                  var simpleTab = {
                  title : wmslst[i].name,
                  html  : metadatalst[i].replace(/\n/g,"<p>"),
                  autoScroll: true
                  };
                  tabMetadataItems.push(simpleTab);
            }
                var tabPanel = new Ext.TabPanel({
                    activeTab         : 0,
                    id                : 'myTPanel',
                    enableTabScroll   : true,
                    items             : tabMetadataItems,
                    autoScroll: true
                });
                
                new Ext.Window({
                    width:700,
                    height:350,
                    closeAction:'hide',
                    title:"Metadata",
                    layout : 'fit',
                    items  : tabPanel
                }).show();
            }
          catch(err)
            {
            //Handle errors here
            }
        },
        iconCls:'wmsInfo',
        tooltip:"Service Metadata"
    });
    toctoolbar.push(action);
    toctoolbar.push("-");
   
    //create the layer node class, using the TreeNodeUIEventMixin
    var LayerNodeUI = Ext.extend(GeoExt.tree.LayerNodeUI, new GeoExt.tree.TreeNodeUIEventMixin());   
    var legendPanel = new GeoExt.LegendPanel({
        defaults:{
            labelCls:'mylabel',
            style:'padding:5px'
        },
        title:"legend",
        autoHeight:true,
        autoShow:true,
        autoScroll:true,
        split:true,
        collapsible:true,
        collapsed:false,
        border:false,
        map:map,
        region:'south'
    });
    
    
    
    //Extend to add WFS
//    function addWFSfromURL(wfsurl){
//    	layerParams = {format:'image/png', transparent:'TRUE'};
//    	wfsCapurl = wfsurl.replace(/^\s+|\s+$/g, '');
//    	wfsCapurl += "?service=WMS&request=GetCapabilities";
//	      var node = new Ext.tree.AsyncTreeNode({
//	      text: wfsurl,
//	      loader: new GeoExt.tree.WMSCapabilitiesLoader({
//	          url: "GetRemoteService?serviceurl="+encodeURIComponent(wfsCapurl)+"&name=wms.xml",
//	          layerOptions: {buffer: 0, singleTile: true, ratio: 1},
//	          layerParams: {'TRANSPARENT': 'TRUE',  format: "image/png"},
//	          // customize the createNode method to add a checkbox to nodes
//	          createNode: function(attr) {
//	              attr.checked = attr.leaf ? false : undefined;
//	              return GeoExt.tree.WMSCapabilitiesLoader.prototype.createNode.apply(this, [attr]);
//	          }
//	      }),
//	      expanded: true
//	  });
//	      nodeOverlays_Folder.appendChild(node);
//	}
    
    //Old addWMS Function, It reads all layers to add to the tree.
//    function addWMSfromURL(wmsurl){
//    	var wmsCapurl = decodeURIComponent(wmsurl);
//    	layerParams = {format:'image/png', transparent:'TRUE'};
//    	if(wmsCapurl.indexOf("?", 0)>-1)
//    		wmsCapurl = wmsCapurl.substring(0, wmsCapurl.indexOf("?", 0));
//    	wmsCapurl = wmsCapurl.replace(/^\s+|\s+$/g, '');
//    	wmsCapurl += "?service=WMS&request=GetCapabilities";
//    	  
//	      var node = new Ext.tree.AsyncTreeNode({
//	      text: wmsurl,
//	      loader: new GeoExt.tree.WMSCapabilitiesLoader({
//	          url: "GetRemoteService?serviceurl="+encodeURIComponent(wmsCapurl),
//	          layerOptions: {buffer: 0, singleTile: true, ratio: 1,  format: "image/png"},
//	          layerParams: {transparent: 'TRUE',  format: 'image/png'},
//	          // customize the createNode method to add a checkbox to nodes
//	          createNode: function(attr) {
//	              attr.checked = attr.leaf ? false : undefined;
//	              return GeoExt.tree.WMSCapabilitiesLoader.prototype.createNode.apply(this, [attr]);
//	          }
//	      }),
//	      expanded: true
//	  });
//	      nodeOverlays_Folder.appendChild(node);
//        Ext.Ajax.request({
//        	url:  "GetRemoteService",
//            params:{serviceurl:wmsCapurl,name:"temp.xml"},
//            method: 'GET',
//            failure: function(response){
//                var text = response.responseText;
//                alert(text);
//                },
//
//            success: function(response){
//
//                var parser = new OpenLayers.Format.WMSCapabilities();
//                var caps = parser.read(response.responseXML || response.responseText);
//                
//                var srs=caps.capability.layers[0].srs;
//                for(var name in srs) {
//                    store.add(new store.recordType({
//                    	name: name,
//                    	projection:name
//                    	}));
//                }
//                // return the newly created TreeNode through a callback function
//                Ext.callback(this.callback, this.scope, [node,caps]);
//                }
//        });
//    };

    tree = new Ext.tree.TreePanel({
        id:"toctree",
        border:true,
        region:"north",
        title:"Layers",
        split:true,
        collapsible:true,
        collapsed:false,
        collapseMode:"mini",
        autoScroll:true,
        loader:new Ext.tree.TreeLoader({
            //applyLoader has to be set to false
            applyLoader:false,
            uiProviders:{
                "layernodeui":LayerNodeUI
            }
        }),
        root: root,
        listeners: {
            // Add layers to the map when ckecked, remove when unchecked.
            // Note that this does not take care of maintaining the layer
            // order on the map.
            'checkchange': function(node, checked) {
                if (checked === true) {
                	activeNodes.push(node);
                	node.attributes.layer.setVisibility(true);
                	if(node.attributes.layer&&node.attributes.layer.CLASS_NAME==="OpenLayers.Layer.Vector"){ 
                		select = new OpenLayers.Control.SelectFeature(node.attributes.layer);
                		node.attributes.layer.events.on({
    	                     "featureselected": onFeatureSelect,
    	                     "featureunselected": onFeatureUnselect
    	                 });
    	                 map.addControl(select);
    	                 select.activate(); 
    	            }
                } else {
                	node.attributes.layer.setVisibility(false);
                	activeNodes.splice(activeNodes.indexOf(node),1);
                	if(node.attributes.layer&&node.attributes.layer.CLASS_NAME==="OpenLayers.Layer.Vector")
                	{ 
                		select = null;
    	            }
                }
            }
        },
        rootVisible:false,
        lines:false
    });
    
    var optLeftPanel = {      
    		border:true,
	        region:"west",
	        title:"Workspace",
	        width:200,
	        split:true,
	        collapsible:true,
	        collapseMode:"mini",
	        autoScroll:true,
	        items:[tree,legendPanel]};
    if(mode === 'advanced')
    	optLeftPanel = OpenLayers.Util.extend(optLeftPanel, {tbar:toctoolbar});
    
    leftPanel = new Ext.Panel(optLeftPanel);
    
    viewerport = new Ext.Viewport({
        layout: "border",
        items: [ mapPanel,leftPanel]
    });

}
				
