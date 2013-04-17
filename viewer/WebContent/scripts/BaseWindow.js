Ext.namespace('Viewer');

/**
 * Class: Viewer.BaseWindow
 *      Base window to set custom properties of application windows.
 *      All application windows must inherit from this class
 *
 * Inherits from:
 *  - {Ext.Window}
 */

/**
 * Constructor: Viewer.BaseWindow
 * Create an instance of Viewer.BaseWindow
 *
 * Parameters:
 * config - {Object} A config object used to set 
 *     window's properties.
 */
Viewer.BaseWindow = function(config) {
    Ext.apply(this, config);
    Viewer.BaseWindow.superclass.constructor.call(this);
};

Ext.extend(Viewer.BaseWindow, Ext.Window, {

    /**
     * APIProperty: map
     * {<OpenLayers.Map>}
     */
    map: null,

    /**
     * Method: init
     *     Initialize this component.
     */
    initComponent: function() {
        Viewer.BaseWindow.superclass.initComponent.call(this);

        this.constrainHeader = true;
        this.collapsible = true;
        this.layout = 'fit';
        this.plain = true;
        this.stateful = false;
    }
});
