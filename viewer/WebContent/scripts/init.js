/*
 *   Document   : init.js
 *   Created on : Sep 2, 2012, 11:28:27 AM
 *   Updated: Mar 14, 2014
 *   Author     : kai liu
 *   Based on: GeoNetwork viewer
 */

Ext.namespace('Viewer');

var mapPanel, ltree, map, addWmsWin, form, opcityWin, layersPanel, legendPanel, featureinfo, zoomSelector, combo, eastPanel, root, options, loadMask;
var activeNodes = [];
var tabMetadataItems = [], proj_all_services = [], wmslst = [];
var simplemode = false;
var select = null;
var bProj = true;
var mode = 'simple';
var baselayer;
var viewerport;
var lurl = document.URL;
var wmclayers = [];
var toolbarItems = [], action, actions = [], toctoolbar = [];
// simple array store of projection
// var store = new Ext.data.ArrayStore({
// fields: ['name', 'projection'],
// data : [
// ],
// autoLoad:false
// });

var optionlst = [
		{
			// projection: new OpenLayers.Projection("EPSG:3857"),
			displayProjection : "EPSG:4326",
			numZoomLevels : 18,
			maxExtent : new OpenLayers.Bounds(-20037508.34, -20037508.34,
					20037508.34, 20037508.34)
		},
		{
			// projection: new OpenLayers.Projection("EPSG:4326"),
			numZoomLevels : 18,
			maxExtent : new OpenLayers.Bounds(-180, -90, 180, 90),
			units : "degrees"
		},
		{
			// projection: new OpenLayers.Projection("EPSG:3571"),
			units : "m",
			numZoomLevels : 18,
			maxResolution : 80092,
			maxExtent : new OpenLayers.Bounds(-12741629.065420,
					-12741629.065420, 12741629.065420, 12741629.065420),
			restrictedExtent : new OpenLayers.Bounds(-12741629.065420,
					-12741629.065420, 12741629.065420, 12741629.065420)
		} ];

var baselayerlst = [
		new OpenLayers.Layer.XYZ(
				"OpenStreetMap",
				[
						"http://otile1.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png",
						"http://otile2.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png",
						"http://otile3.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png",
						"http://otile4.mqcdn.com/tiles/1.0.0/map/${z}/${x}/${y}.png" ],
				{
					attribution : " Map data CC-BY-SA by <a href='http://www.openstreetmap.org/' target='_blank'>OpenStreetMap</a>  Tiles by <a href='http://www.mapquest.com/'  target='_blank'>MapQuest</a>",
					transitionEffect : "resize",
					buffer : 0,
					sphericalMercator : true
				}),
		new OpenLayers.Layer.WMS(
				"OpenLayers WMS",
				"http://vmap0.tiles.osgeo.org/wms/vmap0",
				{
					layers : 'basic'
				},
				{
					attribution : " Map data CC-BY-SA by <a href='http://www.openstreetmap.org/' target='_blank'>OpenStreetMap</a>  Tiles by <a href='http://www.mapquest.com/'  target='_blank'>MapQuest</a>",
					buffer : 0,
					visibility : true,
					isBaseLayer : true
				}),
		new OpenLayers.Layer.WMS("Imagery",
				"http://54.225.77.204/geoserver/wms", {
					layers : "arctic_sdi:bmng_laea"
				}, {
					buffer : 0,
					visibility : true,
					isBaseLayer : true
				}) ];

var projlst = [ [ "EPSG:3857", "EPSG:900913" ], [ "CRS:84", "EPSG:4326" ], [ "EPSG:3571" ] ];

// remove the activeNodes layer from a map
function removeLayerHandler(node) {
	if (typeof node !== 'undefined') {
		var layer;
		layer = node.attributes.layer;
		if (layer) {
			if (!layer.isBaseLayer) {
				if ((typeof (layer.isLoading) == "undefined") || // Layers
				// added
				// from WMC
				(layer.isLoading == false)) {
					map.removeLayer(layer);
					// activeNodes.splice(activeNodes.indexOf(node),1);

					// Ext.getCmp('legendwms').forceRemoveLegend(node.attributes.layer.id);
					// if (activeNodes == node) activeNodes = null;
					var parentNode = node.parentNode;
					node.remove(true);
					if (!parentNode.hasChildNodes()) {
						parentNode.set('leaf', true);
					}

					// refreshTocToolbar(activeNodes);
					// Ext.getCmp('toctree').getSelectionModel().clearSelections();
				}
			}
		}
	}
}

function zoomlayer(layer) {
	var curlayer = layer;
	if (curlayer) {
		if (curlayer.llbbox) {
			// store info as wgs84
			var mapProj = map.getProjectionObject();
			var wgs84 = new OpenLayers.Projection("EPSG:4326");
			var llbbox = curlayer.llbbox;
			var minMapxy = new OpenLayers.LonLat(llbbox[0], llbbox[1])
					.transform(wgs84, mapProj);
			var maxMapxy = new OpenLayers.LonLat(llbbox[2], llbbox[3])
					.transform(wgs84, mapProj);
			// -20037508, -20037508,20037508, 20037508
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
		Ext.MessageBox.alert("NoSelectedLayer", "Please select layer to zoom");
	}
}
function addKMLfromDirectURL(kmlurl) {
	var kmlLayer = new OpenLayers.Layer.Vector("KML", {
		projection : new OpenLayers.Projection("EPSG:4326"),
		strategies : [ new OpenLayers.Strategy.Fixed() ],
		protocol : new OpenLayers.Protocol.HTTP({
			url : "GetRemoteService?url=" + kmlurl + "&servicetype=kml",
			format : new OpenLayers.Format.KML({
				extractStyles : true,
				extractAttributes : true,
				maxDepth : 2
			})
		})
	});
	map.addLayer(kmlLayer);
	select = new OpenLayers.Control.SelectFeature(kmlLayer);
	kmlLayer.events.on({
		"featureselected" : onFeatureSelect,
		"featureunselected" : onFeatureUnselect
	});
	map.addControl(select);
	select.activate();
	var kmlname = decodeURIComponent(kmlurl);
	var node = new Ext.tree.TreeNode({
		layer : kmlLayer,
		text : kmlname,
		checked : true,
		leaf : true
	});
	root.appendChild(node);
	activeNodes.push(node);
}
function addKMLfromURL(kmlurl) {
	Ext.Ajax.request({
		url : "GetRemoteService",
		params : {
			url : encodeURIComponent(decodeURIComponent(kmlurl)),
			servicetype : "kml"
		},
		method : 'GET',
		timeout : 20000,
		failure : function(response) {
			// if it failed, use EPSG:3857
			Ext.MessageBox.alert("Warning", "Can not load map");
		},
		success : function(response) {
			var href = response.responseXML.getElementsByTagName('href');
			if (typeof href === 'undefined' || typeof href[0] === 'undefined') {
				addKMLfromDirectURL(kmlurl);
			} else {
				var href = href[0].textContent;
				if (href.length < 4)
					return;
				else if (href.substring(href.length - 3, href.length)
						.toUpperCase() == 'KML')
					addKMLfromURL(href);
				else if (href.substring(href.length - 3, href.length)
						.toUpperCase() == 'KMZ')
					addKMZfromURL(href);
				else
					addKMLfromDirectURL(kmlurl);
			}
		}
	});
};

function onPopupClose(evt) {
	select.unselectAll();
}

function onFeatureSelect(event) {
	var feature = event.feature;
	// Since KML is user-generated, do naive protection against
	// Javascript.
	var content = "<h2>" + feature.attributes.name + "</h2>"
			+ feature.attributes.description;
	if (content.search("<script") != -1) {
		content = "Content contained Javascript! Escaped content below.<br>"
				+ content.replace(/</g, "&lt;");
	}
	popup = new OpenLayers.Popup.FramedCloud("chicken", feature.geometry
			.getBounds().getCenterLonLat(), new OpenLayers.Size(100, 100),
			content, null, true, onPopupClose);
	feature.popup = popup;
	map.addPopup(popup);
}

function onFeatureUnselect(event) {
	var feature = event.feature;
	if (feature.popup) {
		map.removePopup(feature.popup);
		feature.popup.destroy();
		delete feature.popup;
	}
}
function addKMZfromDirectURL(kmzurl) {
	var kmzLayer = new OpenLayers.Layer.Vector("KML", {
		projection : new OpenLayers.Projection("EPSG:4326"),
		strategies : [ new OpenLayers.Strategy.Fixed() ],
		protocol : new OpenLayers.Protocol.HTTP({
			url : "Kmztokml?url=" + kmzurl,
			format : new OpenLayers.Format.KML({
				extractStyles : true,
				extractAttributes : true,
				maxDepth : 4
			})
		})
	});
	map.addLayer(kmzLayer);
	select = new OpenLayers.Control.SelectFeature(kmzLayer);
	kmzLayer.events.on({
		"featureselected" : onFeatureSelect,
		"featureunselected" : onFeatureUnselect
	});
	map.addControl(select);
	select.activate();
	var kmzname = decodeURIComponent(kmzurl);
	var node = new Ext.tree.TreeNode({
		layer : kmzLayer,
		text : kmzname,
		checked : true,
		leaf : true
	});
	root.appendChild(node);
	activeNodes.push(node);
}

function addGEORSSfromURL(rssurl) {
	var localUrl = "GetRemoteService?url="
			+ encodeURIComponent(decodeURIComponent(rssurl))
			+ "&servicetype=GEORSS";
	var parts = rssurl.split("/");
	var newl = new OpenLayers.Layer.GeoRSS(parts[parts.length - 1], localUrl);
	map.addLayer(newl);
	var node = new Ext.tree.TreeNode({
		layer : newl,
		text : parts[parts.length - 1],
		checked : true,
		leaf : true
	});
	root.appendChild(node);
	activeNodes.push(node);
};

function addKMZfromURL(kmzurl) {
	Ext.Ajax.request({
		url : "Kmztokml",
		params : {
			url : encodeURIComponent(decodeURIComponent(kmzurl))
		},
		method : 'GET',
		timeout : 20000,
		failure : function(response) {
			// if it failed, use EPSG:3857
			Ext.MessageBox.alert("Warning", "Can not load map");
		},
		success : function(response) {
			var href = response.responseXML.getElementsByTagName('href');
			if (typeof href === 'undefined' || typeof href[0] === 'undefined') {
				addKMZfromDirectURL(kmzurl);
			} else {
				var href = href[0].textContent;
				if (href.length < 4)
					return;
				else if (href.substring(href.length - 3, href.length)
						.toUpperCase() == 'KML')
					addKMLfromURL(href);
				else if (href.substring(href.length - 3, href.length)
						.toUpperCase() == 'KMZ')
					addKMZfromURL(href);
				else
					addKMZfromDirectURL(kmzurl);
			}
		}
	});
};

OpenLayers.Control.Click = OpenLayers
		.Class(
				OpenLayers.Control,
				{
					defaultHandlerOptions : {
						'single' : true,
						'double' : false,
						'pixelTolerance' : 0,
						'stopSingle' : false,
						'stopDouble' : false
					},

					initialize : function(options) {
						this.handlerOptions = OpenLayers.Util.extend({},
								this.defaultHandlerOptions);
						OpenLayers.Control.prototype.initialize.apply(this,
								arguments);
						this.handler = new OpenLayers.Handler.Click(this, {
							'click' : this.trigger
						}, this.handlerOptions);
					},

					trigger : function(e) {
						var lonlat = map.getLonLatFromPixel(e.xy);
						if (activeNodes.length >= 1) {
							var curlayer = activeNodes[0].attributes.layer;
							if (curlayer
									&& curlayer.CLASS_NAME === "OpenLayers.Layer.WMS") {
								var url = curlayer.getFullRequestString({
									REQUEST : "GetFeatureInfo",
									EXCEPTIONS : "application/vnd.ogc.se_xml",
									BBOX : map.getExtent().toBBOX(),
									X : e.xy.x,
									Y : e.xy.y,
									INFO_FORMAT : 'text/plain',
									LAYERS : curlayer.layerid,
									QUERY_LAYERS : curlayer.layerid,
									FEATURE_COUNT : 1,
									WIDTH : map.size.w,
									HEIGHT : map.size.h
								}, curlayer.url);
								Ext.Ajax
										.request({
											url : "GetRemoteService",
											params : {
												url : url,
												servicetype : "wmsgetfeatureinfo"
											},
											method : 'GET',
											failure : function(response) {
												Ext.MessageBox.alert("alert",
														response.responseText);
											},
											success : function(response) {
												if (response.responseText
														.indexOf('no results') !== -1) {
												} else if (response.responseText
														.trim() === '') {
												} else {
													var abx = new Ext.Window(
															{
																width : 400,
																height : 300,
																closeAction : 'hide',
																autoScroll : true,
																title : "Feature Information",
																html : setHTML(response),
																buttons : [ {
																	text : 'Response Text',
																	handler : function() {
																		var abxText = new Ext.Window(
																				{
																					width : 400,
																					height : 300,
																					closeAction : 'hide',
																					autoScroll : true,
																					title : "Feature Information",
																					html : response.responseText
																				});
																		abxText
																				.addClass('x-window-white');
																		abxText
																				.show();
																	}
																} ]
															});
													abx
															.addClass('x-window-white');
													abx.show();
												}

											}
										});
							} else if (curlayer
									&& curlayer.CLASS_NAME === "OpenLayers.Layer.Vector") {
							}
						}
					}

				});

// If we have options, we can initialize the map
function setmap(options, baselayer) {
	map = new OpenLayers.Map('map', options);
	map.addLayer(baselayer);
	// map.events.register("click", map, function(evt) {
	// if (activeNodes.length >= 1) {
	// var curlayer = activeNodes[0].attributes.layer;
	// if (curlayer && curlayer.CLASS_NAME === "OpenLayers.Layer.WMS") {
	// var url = curlayer.getFullRequestString({
	// REQUEST : "GetFeatureInfo",
	// EXCEPTIONS : "application/vnd.ogc.se_xml",
	// BBOX : map.getExtent().toBBOX(),
	// X : evt.xy.x,
	// Y : evt.xy.y,
	// INFO_FORMAT : 'text/plain',
	// LAYERS : curlayer.name,
	// QUERY_LAYERS : curlayer.name,
	// FEATURE_COUNT : 1,
	// WIDTH : map.size.w,
	// HEIGHT : map.size.h
	// }, curlayer.url);
	// Ext.Ajax.request({
	// url : "GetRemoteService",
	// params : {
	// url : url,
	// servicetype : "wmsgetfeatureinfo"
	// },
	// method : 'GET',
	// failure : function(response) {
	// Ext.MessageBox.alert("alert", response.responseText);
	// },
	// success : function(response) {
	// var abx = new Ext.Window({
	// width : 400,
	// height : 300,
	// closeAction : 'hide',
	// autoScroll : true,
	// title : "Feature Information",
	// html : setHTML(response)
	// });
	// abx.addClass('x-window-white');
	// abx.show();
	// }
	// });
	// } else if (curlayer
	// && curlayer.CLASS_NAME === "OpenLayers.Layer.Vector") {
	// }
	// }
	// });
	var click = new OpenLayers.Control.Click();
	map.addControl(click);
	click.activate();

	map.addControl(new OpenLayers.Control.LayerSwitcher());
	map.addControl(new OpenLayers.Control.MousePosition());
};

// find the projection
// 1) if user set the projection in the URL
function getProjIndex(proj) {
	for (var i1 = 0; i1 < projlst.length; ++i1) {
		for (var i2 = 0; i2 < projlst[i1].length; ++i2) {
			if (projlst[i1][i2] === proj) { // check if we can find the initProj
				// in projlst
				return i1;
			}
		}
	}
	// If we can't fined the projection in proj list
	return 0;
};

// add layer from getmap request
function addLayerFromGetMap(turi) {
	var layers = turi.getQueryParamValue('LAYERS');
	if (typeof layers === 'undefined')
		return;
	else {
		var wms = new OpenLayers.Layer.WMS(layers,
				turi.toString().split('?')[0], {
					layers : layers,
					format : 'image/png',
					transparent : 'TRUE'
				}, {
					ratio : 1,
					visibility : true
				});
		map.addLayer(wms);
	}
};

function processLayer(layerM, url, node) {
	var checkedLayers = 0;
	for (var i = 0, len = layerM.nestedLayers.length; i < len; ++i) {
		var checked = false;
		layer = layerM.nestedLayers[i];
		if (layer.llbbox
				&& (!layer.nestedLayers || layer.nestedLayers.length == 0)
				&& checkedLayers == 0) {
			checked = true;
			checkedLayers = 1;
		}

		var wmsLayer = createWMSLayer(layer, url, checked);
		if (typeof wmsLayer !== 'undefined'
				&& typeof layer.name !== 'undefined') {

			map.addLayer(wmsLayer);
			if (checked)
				zoomlayer(wmsLayer);
		}
		var optTreeNode = {
			text : layer.title || layer.name,
			// use nodeType 'node' so no AsyncTreeNodes are created
			nodeType : 'node',
			layer : wmsLayer,
			expanded : true,
			leaf : (layer.nestedLayers.length === 0)
		};
		if (!layer.nestedLayers || layer.nestedLayers.length == 0)
			optTreeNode = OpenLayers.Util.extend(optTreeNode, {
				checked : checked
			})
		var n = new Ext.tree.TreeNode(optTreeNode);
		if (checked)
			activeNodes.push(n);
		if (n) {
			node.firstChild == null ? node.appendChild(n) : node.insertBefore(
					n, node.firstChild);
		}
		if (layer.nestedLayers) {
			processLayer(layer, url, n);
		}
	}
};

function createWMSLayer(layer, url, checked) {
	layerParams = {
		format : 'image/png',
		transparent : 'TRUE'
	};
	layerOptions = {
		ratio : 1,
		isBaseLayer : false
	};
	layeroptions = OpenLayers.Util.extend({
		minScale : layer.minScale,
		queryable : layer.queryable,
		maxScale : layer.maxScale,
		metadataURL : layer.metadataURL,
		dimensions : layer.dimensions,
		styles : layer.styles,
		llbbox : layer.llbbox,
		layerid : layer.name
	}, layerOptions);
	layeroptions = OpenLayers.Util.extend(layeroptions, checked ? {
		visibility : true
	} : {
		visibility : false
	});
	var wmsLayer = new OpenLayers.Layer.WMS(layer.title, url, {
		layers : layer.name,
		transparent : 'TRUE'
	}, layeroptions);
	if (layer.styles && layer.styles.length > 0) {
		var style = layer.styles[0];
		if (style.legend && style.legend.href) {
			wmsLayer.legendURL = style.legend.href;
		}
	}
	return wmsLayer;
};

// add all layers in the wms
function addwms(caps) {
	processLayer(caps.capability, caps.capability.request.getmap.href, root);
};

/*
 * Get the Ajax response and pop up a info bubble
 */
function setHTML(response) {
	if (response.responseText.indexOf('no results') == -1) {
		var tplstring = '<table class="table table-striped table-bordered table-condensed" data-module="table-toggle-more" ><tbody>';
		tplstring += '<thead><tr><th >Field</th><th >Value</th></tr></thead><tbody>';
		// var cat = "Unknown", src = "Unknown", leg = "Unknown", linkinfo = "";

		try {
			// To format responseText, many cases
			// case 1
			if (response.responseText.indexOf('=') == -1
					&& response.responseText.indexOf(';') == -1) {
				var lines = response.responseText.trim().split('\n');
				if (lines.length === 2) {
					var fields = lines[0].replace(/^\s*/, '').replace(/\s*$/,
							'').replace(/ = /, "=").replace(/'/g, '')
							.split('"');
					var values = lines[1].replace(/^\s*/, '').replace(/\s*$/,
							'').replace(/ = /, "=").replace(/'/g, '')
							.split('"');
					for (var j = 0; j < fields.length; ++j) {
						var field = fields[j];
						if (field.trim() === '' || field.trim() === ""
								|| field.trim() === "''"
								|| field.trim() === '""')
							continue;
						var value = values[j];
						tplstring += '<tr class="olFeatureInfoRow">'
								+ '<td width="30%" class="olFeatureInfoColumn"> <b>'
								+ field
								+ '</b></td><td width="70%" class="olFeatureInfoValue">'
								+ value + '</td></tr>';
					}
				}
			}
			// case 2:
			else {
				var lines = response.responseText.split('\n');
				for (var lcv = 0; lcv < (lines.length); lcv++) {
					var vals = lines[lcv].replace(/^\s*/, '').replace(/\s*$/,
							'').replace(/ = /, "=").replace(/'/g, '')
							.split('=');
					if (vals && vals.length == 2)
						tplstring += '<tr class="olFeatureInfoRow">'
								+ '<td width="30%" class="olFeatureInfoColumn"> <b>'
								+ vals[0]
								+ '</b></td><td width="70%" class="olFeatureInfoValue">'
								+ vals[1] + '</td></tr>';
					else {
						vals = vals[0].split(';');
						var len = Math.floor(vals.length / 2);
						for (var j = 0; j < len; ++j) {
							var tmp = vals[j].split(' ');
							var field = tmp[tmp.length - 1];
							var value = vals[len + j];
							tplstring += '<tr class="olFeatureInfoRow">'
									+ '<td width="30%" class="olFeatureInfoColumn"> <b>'
									+ field
									+ '</b></td><td width="70%" class="olFeatureInfoValue">'
									+ value + '</td></tr>';
						}
					}
				}
			}
			// there may be many other cases
			tplstring += '</tbody></table>';
			return tplstring;
		} catch (err) {

		}

		// case 2: if there is ""

	}
}

Ext
		.onReady(function() {
			// root node of the left tree which shows the baselayer and added
			// map services
			root = new Ext.tree.TreeNode({
				expanded : true
			// allow children autoload, and thus layers
			});
			var uri = new Uri(location.search);
			// revised the jsUri to case insensitive
			// mode
			var tmpmode = uri.getQueryParamValue('mode');
			if (typeof tmpmode === 'undefined')
				mode = 'simple';
			else if (tmpmode.toUpperCase() === 'SIMPLE')
				mode = 'simple';
			else if (tmpmode.toUpperCase() === 'ADVANCED')
				mode = 'advanced';
			else {
				Ext.MessageBox
						.show({
							title : 'Warning',
							msg : "Mode should be simple or advanced! Return to use simple mode",
							buttons : Ext.MessageBox.OK,
							icon : Ext.MessageBox.WARNING
						});
				mode = 'simple';
			}

			initViewer();

			try {
				var tmpurls = uri.getQueryParamValue('url');
				var urls = typeof tmpurls === 'undefined' ? [] : tmpurls
						.split(',');
				var tmpStypes = uri.getQueryParamValue('servicetype');
				if (typeof tmpStypes !== 'undefined')
					tmpStypes = tmpStypes.toUpperCase();
				var serviceTypes = typeof tmpStypes === 'undefined' ? []
						: tmpStypes.split(',');
				if (urls.length !== serviceTypes.length) {
					Ext.MessageBox.alert("Warning",
							"Url doesn't match servicetype");
					urls = [];
					serviceTypes = [];
				}
				if (urls.length == 0) {
					options = OpenLayers.Util.extend({
						projection : "EPSG:3857"
					}, optionlst[0]);
					baselayer = baselayerlst[0];
					setmap(options, baselayer);

					loadMask.hide();
					loadMapPanel();
					if (typeof ltree === 'undefined')
						initTtree();
				}

				var initProj = uri.getQueryParamValue('srs');
				if (typeof initProj !== 'undefined') {
					var i = getProjIndex(initProj);
					options = OpenLayers.Util.extend({
						projection : initProj
					}, optionlst[i]);
					baselayer = baselayerlst[i];
				}
				// 2) if there is kml or kmz in the URL,
				if (serviceTypes.indexOf("KML") >= 0
						|| serviceTypes.indexOf("KMZ") >= 0
						|| serviceTypes.indexOf("GEORSS") >= 0) {
					options = OpenLayers.Util.extend({
						EPSG : 3857
					}, optionlst[0]);
					baselayer = baselayerlst[0];
				}
				if (typeof map === 'undefined'
						&& typeof options !== 'undefined') {
					setmap(options, baselayer);
					loadMask.hide();
					loadMapPanel();
				}

				// Check the projection list from WMS
				for (var i = 0, len = urls.length; i < len; i++) {
					var tmptype = serviceTypes[i].toUpperCase();
					if (tmptype === 'WMS') {
						var wmsgetmapuri = new Uri(decodeURIComponent(urls[i]));
						var request = wmsgetmapuri
								.getQueryParamValue('request');
						projfromGetMap = wmsgetmapuri.getQueryParamValue('CRS');
						if (typeof request !== 'undefined'
								&& request.toUpperCase() === 'GETMAP') {
							if (typeof options === 'undefined') {
								// GetMapRequest always have SRS
								var projFromGetMap = wmsgetmapuri
										.getQueryParamValue('srs')
										.toUpperCase();
								var i = getProjIndex(initProj);
								options = OpenLayers.Util.extend({
									projection : initProj
								}, optionlst[i]);
								baselayer = baselayerlst[i];
								if (typeof map === 'undefined'
										&& typeof options !== 'undefined') {
									setmap(options, baselayer);
								}
							}
							addLayerFromGetMap(wmsgetmapuri);
						} else {
							Ext.Ajax
									.request({
										url : "GetRemoteService",
										params : {
											url : encodeURIComponent(decodeURIComponent(urls[i])),
											servicetype : serviceTypes[i]
										},
										method : 'GET',
										timeout : 20000,
										failure : function(response) {
											// if it failed, use EPSG:3857
											Ext.MessageBox.alert("Warning",
													"Can not load map");
											options = OpenLayers.Util.extend({
												projection : "EPSG:3857"
											}, optionlst[0]);
											baselayer = baselayerlst[0];
											if (typeof map === 'undefined'
													&& typeof options !== 'undefined') {
												setmap(options, baselayer);
												loadMask.hide();
												loadMapPanel();
											}
										},
										success : function(response) {
											var parser = new OpenLayers.Format.WMSCapabilities();
											var caps = parser
													.read(response.responseXML
															|| response.responseText);
											if (typeof caps.capability === 'undefined') {
												Ext.MessageBox.alert("Warning",
														"Can not load map");
												if (typeof map === 'undefined'
														&& typeof options === 'undefined') {
													var i = getProjIndex(selectedProj);
													options = OpenLayers.Util
															.extend(
																	{
																		projection : selectedProj
																	},
																	optionlst[0]);
													baselayer = baselayerlst[0];
													setmap(options, baselayer);
													loadMask.hide();
													loadMapPanel();
												}
												if (typeof ltree === 'undefined')
													initTtree();
												return;
											}

											var srs = caps.capability.layers[0].srs;
											for ( var name in srs) {
												proj_all_services.push(name);
											}
											proj_all_services = proj_all_services
													.filter(function(elem, pos) {
														return proj_all_services
																.indexOf(elem) == pos;
													});

											// the default selected Proj is 3857
											var selectedProj;
											for (var i = 0, len = proj_all_services.length; i < len; i++) {

												if (proj_all_services[i]
														.toUpperCase() === "EPSG:3857"
														|| proj_all_services[i]
																.toUpperCase() === "EPSG:90013") {
													selectedProj = proj_all_services[i]
															.toUpperCase();
													break;
												}
											}
											if (typeof selectedProj === 'undefined') {
												for (var i = 0, len = proj_all_services.length; i < len; i++) {
													if (proj_all_services[i]
															.toUpperCase() === "CRS:84"
															|| proj_all_services[i]
																	.toUpperCase() === "EPSG:4326") {
														selectedProj = "EPSG:4326";
														break;
													}
												}
											}
											if (typeof selectedProj === 'undefined') {
												selectedProj = "EPSG:3857";
											}
											// 3) if options still be undefined,
											// we should use the proj from wms
											if (typeof map === 'undefined'
													&& typeof options === 'undefined') {
												var i = getProjIndex(selectedProj);
												options = OpenLayers.Util
														.extend(
																{
																	projection : selectedProj
																}, optionlst[i]);
												baselayer = baselayerlst[i];
												setmap(options, baselayer);
												loadMask.hide();
												loadMapPanel();
											}

											wmslst.push(caps);
											addwms(caps);
											if (typeof ltree === 'undefined')
												initTtree();
										}
									})
						}

					} else if (tmptype === "KML") {
						addKMLfromURL(urls[i]);
						if (typeof ltree === 'undefined')
							initTtree();
					} else if (tmptype === "KMZ") {
						addKMZfromURL(urls[i]);
						if (typeof ltree === 'undefined')
							initTtree();
					} else if (tmptype === "GEORSS") {
						addGEORSSfromURL(urls[i]);
						if (typeof ltree === 'undefined')
							initTtree();
					}
				}
			} catch (err) {
				Ext.MessageBox.alert("Warning", "Fail to load map");
				urls = [];
				serviceTypes = [];
			}
		});

function initTbar() {
	// ZoomToMaxExtent control, a "button" control
	action = new GeoExt.Action({
		id : "zoomfull",
		control : new OpenLayers.Control.ZoomToMaxExtent(),
		map : map,
		iconCls : 'zoomfull',
		tooltip : "Zoom Full",
		handler : function() {
			map.zoomToExtent(baselayer.maxExtent);
		}
	});
	actions["zoomfull"] = action;
	toolbarItems.push(action);

	action = new GeoExt.Action({
		id : "zoomlayer",
		map : map,
		iconCls : 'zoomlayer',
		tooltip : "Zoom to layer",
		handler : function() {
			if (activeNodes.length >= 1) {
				var curlayer = activeNodes[0].attributes.layer;
				if (curlayer)
					zoomlayer(curlayer)
			} else {
				Ext.MessageBox.alert("NoSelectedLayer",
						"Please select layer to zoom");
			}
		}
	});
	actions["zoomlayer"] = action;
	toolbarItems.push(action);

	action = new GeoExt.Action({
		id : "zoomin",
		control : new OpenLayers.Control.ZoomBox(),
		toggleGroup : "move",
		map : map,
		iconCls : 'zoomin',
		allowDepress : false,
		tooltip : "Zoom In"
	});
	actions["zoomin"] = action;
	toolbarItems.push(action);

	action = new GeoExt.Action({
		id : "zoomout",
		control : new OpenLayers.Control.ZoomBox({
			displayClass : 'ZoomOut',
			out : true
		}),
		toggleGroup : "move",
		allowDepress : false,
		map : map,
		iconCls : 'zoomout',
		tooltip : "Zoom Out"
	});
	actions["zoomout"] = action;
	toolbarItems.push(action);

	action = new GeoExt.Action({
		control : new OpenLayers.Control.DragPan({
			isDefault : true
		}),
		toggleGroup : "move",
		allowDepress : false,
		map : map,
		toggleGroup : "move",
		iconCls : 'pan',
		tooltip : "Pan"
	});
	actions["pan"] = action;
	toolbarItems.push(action);
	toolbarItems.push("-");

	// Navigation history - two "button" controls
	ctrl = new OpenLayers.Control.NavigationHistory();
	map.addControl(ctrl);
	action = new GeoExt.Action({
		id : "resultset_previous",
		control : ctrl.previous,
		iconCls : 'resultset_previous',
		tooltip : "resultset_previous"
	});
	actions["resultset_previous"] = action;
	toolbarItems.push(action);

	action = new GeoExt.Action({
		id : "resultset_next",
		control : ctrl.next,
		iconCls : 'resultset_next',
		tooltip : "resultset_next"
	});
	actions["resultset_next"] = action;
	toolbarItems.push(action);
	toolbarItems.push("-");

	// Save the WMC
	action = new GeoExt.Action({
		id : "savewmc",
		iconCls : 'savewmc',
		tooltip : "Save WMC",
		handler : function() {
			Viewer.WMCManager.saveContext(map);
		}
	});
	actions["savewmc"] = action;
	toolbarItems.push(action);

	Viewer.WindowManager.registerWindow("loadwmc", Viewer.LoadWmcWindow, {
		map : map,
		id : "loadwmc"
	});
	action = new GeoExt.Action({
		// id: "loadwmc",
		map : map,
		iconCls : 'loadwmc',
		tooltip : "Load WMC",
		handler : function() {
			Viewer.WindowManager.showWindow("loadwmc");
		}
	});
	actions["loadwmc"] = action;
	toolbarItems.push(action);
	toolbarItems.push("-");
};

function initTtree() {
	action = new GeoExt.Action({
		id : "addLayer",
		map : map,
		iconCls : 'addLayer',
		tooltip : "Add layer",
		handler : function() {
			addWmsWindow.show();
		}
	});
	toctoolbar.push(action);

	action = new GeoExt.Action({
		id : "tbRemoveButton",
		handler : function() {
			for (var i = 0; i < activeNodes.length; i++) {
				removeLayerHandler(activeNodes[i]);
			}
			activeNodes = [];
		},
		iconCls : 'deleteLayer',
		tooltip : "Remove layer"
	});

	toctoolbar.push(action);
	toctoolbar.push("-");

	action = new GeoExt.Action({
		id : "tbOpacityButton",
		handler : function() {
			var curlayer = activeNodes[0].attributes.layer;
			if (curlayer) {
				opacity(curlayer)
			}
		},
		iconCls : 'layerOpacity',
		tooltip : "Layer opacity"
	});
	toctoolbar.push(action);

	action = new GeoExt.Action({
		id : "tbBLayerOpacityButton",
		handler : function() {
			opacity(baselayer)
		},
		iconCls : 'baselayeropacity',
		tooltip : "Base layer opacity"
	});
	function opacity(layer) {
		var curlayer = layer;
		if (curlayer) {
			if ((typeof (curlayer.isLoading) == "undefined") || // Layers added
			// from WMC
			(curlayer.isLoading == false)) {
				var slider = new GeoExt.LayerOpacitySlider({
					layer : curlayer,
					aggressive : true,
					isFormField : true,
					inverse : true,
					fieldLabel : "opacity",
					plugins : new GeoExt.LayerOpacitySliderTip({
						template : '<div>Transparency: {opacity}%</div>'
					})
				});
				opcityWin = new Ext.Window({
					width : 250,
					height : 50,
					closeAction : 'hide',
					// layout:"border",
					title : "Opacity:" + curlayer.name,
					items : [ slider ]
				});
				opcityWin.show(this);
			}
		}

	}
	toctoolbar.push(action);
	toctoolbar.push("-");
	// Wms Information window
	// If there is an activeNodes, show its information
	action = new GeoExt.Action({
		id : "tbMetadataButton",
		handler : function() {
			// create a new WMS capabilities store
			tabMetadataItems = [];
			try {
				for (var i = 0, len = metadatalst.length; i < len; ++i) {
					var simpleTab = {
						title : wmslst[i].name,
						html : metadatalst[i].replace(/\n/g, "<p>"),
						autoScroll : true
					};
					tabMetadataItems.push(simpleTab);
				}
				var tabPanel = new Ext.TabPanel({
					activeTab : 0,
					id : 'myTPanel',
					enableTabScroll : true,
					items : tabMetadataItems,
					autoScroll : true
				});

				new Ext.Window({
					width : 700,
					height : 350,
					closeAction : 'hide',
					title : "Metadata",
					layout : 'fit',
					items : tabPanel
				}).show();
			} catch (err) {
				// Handle errors here
			}
		},
		iconCls : 'wmsInfo',
		tooltip : "Service Metadata"
	});
	// toctoolbar.push(action);
	// toctoolbar.push("-");
	// create the layer node class, using the TreeNodeUIEventMixin
	var LayerNodeUI = Ext.extend(GeoExt.tree.LayerNodeUI,
			new GeoExt.tree.TreeNodeUIEventMixin());
	var optTree = {
		id : "toctree",
		border : true,
		region : "center",
		split : true,
		header : false,
		collapsible : true,
		collapsed : false,
		collapseMode : "mini",
		autoScroll : true,
		enableDD : true,
		loader : new Ext.tree.TreeLoader({
			// applyLoader has to be set to false
			applyLoader : false,
			uiProviders : {
				"layernodeui" : LayerNodeUI
			}
		}),
		root : root,
		listeners : {
			// Add layers to the map when ckecked, remove when unchecked.
			// Note that this does not take care of maintaining the layer
			// order on the map.
			'checkchange' : function(node, checked) {
				if (checked === true) {
					activeNodes.push(node);
					node.attributes.layer.setVisibility(true);
					if (node.attributes.layer
							&& node.attributes.layer.CLASS_NAME === "OpenLayers.Layer.Vector") {
						select = new OpenLayers.Control.SelectFeature(
								node.attributes.layer);
						node.attributes.layer.events.on({
							"featureselected" : onFeatureSelect,
							"featureunselected" : onFeatureUnselect
						});
						map.addControl(select);
						select.activate();
					}
				} else {
					node.attributes.layer.setVisibility(false);
					activeNodes.splice(activeNodes.indexOf(node), 1);
					if (node.attributes.layer
							&& node.attributes.layer.CLASS_NAME === "OpenLayers.Layer.Vector") {
						select = null;
					}
				}
			},
			beforemovenode : function(tree, node, old_parent, new_parent, index) {
				var nodeBefore = new_parent.item(index);
				var indexLayerBefore = map
						.getLayerIndex(nodeBefore.attributes.layer);
				map.setLayerIndex(node.attributes.layer, indexLayerBefore);
			}
		},
		rootVisible : false,
		lines : false
	};
	if (mode == 'advanced')
		optTree = OpenLayers.Util.extend(optTree, {
			tbar : toctoolbar
		});
	ltree = new Ext.tree.TreePanel(optTree);
	Ext.getCmp('layersPanel').insert(0, ltree);
	Ext.getCmp('layersPanel').doLayout();

	var legendPanel = new GeoExt.LegendPanel({
		defaults : {
			labelCls : 'mylabel',
			style : 'padding:5px'
		},
		header : false,
		autoHeight : true,
		autoShow : true,
		autoScroll : true,
		split : true,
		collapsible : true,
		collapsed : false,
		border : false,
		map : map,
		region : 'center'
	});
	Ext.getCmp('legendPanel').insert(0, legendPanel);
	Ext.getCmp('legendPanel').doLayout();
}

function initViewer() {
	layersPanel = new Ext.Panel({
		id : 'layersPanel',
		border : true,
		region : "north",
		title : "Layers",
		autoScroll : true
	});
	var legendPanel = new Ext.Panel({
		id : 'legendPanel',
		border : true,
		region : "south",
		title : "Legend",
		autoScroll : true
	});
	var optWestPanel = {
		border : true,
		region : "west",
		header : false,
		width : 200,
		split : true,
		collapsible : true,
		collapseMode : "mini",
		autoScroll : true,
		items : [ layersPanel, legendPanel ]
	};
	var westPanel = new Ext.Panel(optWestPanel);
	var optEastPanel = {
		id : 'eastPanel',
		border : true,
		region : "center",
		header : false,
		split : true,
		collapsible : true,
		collapseMode : "mini",
		autoScroll : true
	};
	eastPanel = new Ext.Panel(optEastPanel);
	loadMask = new Ext.LoadMask(Ext.getBody(), {
		msg : 'Loading map'
	});
	loadMask.show();
	viewerport = new Ext.Viewport({
		layout : "border",
		items : mode == 'advanced' ? [ westPanel, eastPanel ] : [ eastPanel ]
	});
};

function loadMapPanel() {
	initTbar();
	var optMapPanel = {
		id : "mappanel",
		border : true,
		region : "north",
		height : eastPanel.getSize().height,
		zoom : 1,
		map : map,
		center : [ 0, 0 ]
	};
	if (mode == 'advanced')
		optMapPanel = OpenLayers.Util.extend(optMapPanel, {
			tbar : toolbarItems
		});
	mapPanel = new GeoExt.MapPanel(optMapPanel);
	map.zoomToMaxExtent();
	eastPanel.insert(0, mapPanel);
	eastPanel.doLayout();
}
