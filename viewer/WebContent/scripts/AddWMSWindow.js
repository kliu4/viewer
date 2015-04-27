var treeAddWMS,root,node1, name=0;

var mapl = new OpenLayers.Map();
mapl.setOptions(options);

var root = new Ext.tree.TreeNode({
    expanded: true, // allow children autoload, and thus layers  
	text: 'WMS Store'
});

node1 = new Ext.tree.AsyncTreeNode({
    text: 'Listed WMS',
    loader: new GeoExt.tree.WMSCapabilitiesLoader({
        url: 'scripts/test.xml',
        layerOptions: {buffer: 0, singleTile: true, ratio: 1},
        layerParams: {'TRANSPARENT': 'TRUE'},
        // customize the createNode method to add a checkbox to nodes
        createNode: function(attr) {
            attr.checked = attr.leaf ? false : undefined;
            return GeoExt.tree.WMSCapabilitiesLoader.prototype.createNode.apply(this, [attr]);
        }
    })
});

root.appendChild(node1);

function getWMS() {
    var url = form.getForm().findField('wmsurl').getValue();
    url = url.replace(/^\s+|\s+$/g, '');
    url += "?service=WMS&request=GetCapabilities";
    if (url != '') {
         addWMS2Tree(url);
    }
};

function addWMS2Tree(url){
	var node = new Ext.tree.AsyncTreeNode({
	    text: form.getForm().findField('wmsurl').getValue(),
	    loader: new GeoExt.tree.WMSCapabilitiesLoader({
	        url: "GetRemoteService?url="+encodeURIComponent(url)+"&servicetype=wms",
	        layerOptions: {buffer: 0, singleTile: true, ratio: 1},
	        layerParams: {'TRANSPARENT': 'TRUE'},
	        // customize the createNode method to add a checkbox to nodes
	        createNode: function(attr) {
	            attr.checked = attr.leaf ? false : undefined;
	            return GeoExt.tree.WMSCapabilitiesLoader.prototype.createNode.apply(this, [attr]);
	        }
	    })
	});
	root.appendChild(node);
}


var mapPanelPre = new GeoExt.MapPanel({
    id:"mappanel",
    border:true,
    region:"center",      
    map:mapl,
    center: [0, 0],
    zoom: 3
});

//var preview = new Ext.Panel({
//			region : 'east',
//			margins : '3 3 3 0',
//			activeTab : 0,
//			title: "Layer Preview",
//			defaults : {
//				autoScroll : true
//			},
//			items:[mapPanelPre]
//		});

var url = new Ext.form.TextField({
	  fieldLabel: 'URL',
	  name: 'wmsurl',
	  width:370,
	  autoHeight: true,
	  region:'north'
	});

var but = new Ext.Button({
  id: 'parse', 
  text:"Connect",
  width:50,
  heigth:30,
  handler: function(){	
	  getWMS();
  }
});

var form = new Ext.form.FormPanel({
	width:400,
	autoHeight:true,
	region: 'north',
	labelWidth: 25});

form.add(url);
form.add(but);



treeAddWMS = new Ext.tree.TreePanel({
    root: root,
    region: 'center',
    width: 400,
    autoScroll: true,
    listeners: {
        // Add layers to the map when ckecked, remove when unchecked.
        // Note that this does not take care of maintaining the layer
        // order on the map.
        'checkchange': function(node, checked) { 
            if (checked === true) {
                mapPanel.map.addLayer(node.attributes.layer); 
                var node = new Ext.tree.TreeNode({layer: node.attributes.layer, text:
                	node.attributes.layer.name, checked: true, leaf: true});
                nodeOverlays_Folder.appendChild(node);
//                mapl.addLayer(node.attributes.layer);
            } else {
                mapPanel.map.removeLayer(node.attributes.layer);
            }
        }
    }
});


var addLayerManager = new Ext.Panel({
			title : 'Add WMS',
			region : 'center',
			split : true,
			width : 400,
			collapsible : true,
			margins : '3 0 3 3',
			cmargins : '3 3 3 3',
			layout : 'border',
			items:[form]
		});

var addWmsWindow = new Ext.Window({
	width : 400,
	height : 500,
	closeAction : 'hide',
	title : "Add WMS",
	plain : true,
	layout : 'border',
	items : [form]

	});