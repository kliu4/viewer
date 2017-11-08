## Viewer

This small web application is used to visualize the WMS, KML, KMZ, GeoRSS

To use this web application, you can create a war file and use Apache-Tomcat (Tomcat 7 is recommended) to publish it.

## API Reference

It supports simple RESTful pattern url to load WMS, KML, KMZ or GeoRss

URL structure with parameters:
https://climateathome.org/viewer?url=service1,service2,....&servicetype=service1Type,service2Type,...&srs=supportedProjection

Parameters:

•	url: [required] one service url, or a list of service urls separated by comma. 

•	servicetype: [required]  the service type(s) for the service(s) provided in the url parameter. Currently supported service types: WMS, KML, KMZ

•	srs: [optional]: WMS service projection, e.g EPSG:3572, EPSG: 4326 etc. 

Two modes are supported: simple and advanced. The default mode is simple mode

DEMO:

https://climateathome.org/viewer/?url=http://mrdata.usgs.gov/services/pr&servicetype=wms&mode=advanced
https://climateathome.org/viewer/?url=http://mrdata.usgs.gov/services/pr&servicetype=wms

