
var form = new Ext.form.FormPanel({
	width:400,
	autoHeight:true,
	region: 'center',
	labelWidth: 25,
	items:[{
        xtype: 'fileuploadfield',
        id: 'form-file',
        emptyText: OpenLayers.i18n("selectWMCFile"),
        autoWidth:true,
        hideLabel : true,
        buttonText: '',
        name: 'Fileconten',
        buttonCfg: {
            text: '',
            iconCls: 'selectfile'
        }
    }]
});

var loadWMCWindow = new Ext.Window({
	width : 400,
	height : 100,
	closeAction : 'hide',
	title : "Load WMC",
	plain : true,
	layout : 'border',
    items : [form],
    buttons: [{
		 text:'Load',
		 handler: function(){
			 if (form.getForm().isValid()) {
                 form.getForm().submit({
                     url: 'LoadWmc'
//                     success: this.onSuccessLoad,
//                     failure: this.onFailure,
//                     scope: this
                 });
             }
		 }
	},{
		 text: 'Merge',
		 handler: function(){
//			 addWmsWin.hide();
		 }
	}]
});