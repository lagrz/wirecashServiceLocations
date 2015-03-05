Wirecash Service Locations Class
====================================
A jQuery / Google Maps Class that creates a templated paginated UI for displaying `ServiceLocation` records.

Features:

* Template based layout
* Independant of MVC frameworks
* Can be modified or inherited to other classes easily
* Fires custom events

Class Summary
-----------------------

The main globally exposed constructor is `$.WCServiceLocationsView` creates a new instance of `ServiceLocationsView`.
You can also use the basic object factory by using `$.WCServiceLocationsView.create` or as a jQuery plugin `$('#the-container').WCServiceLocationsView`.

* Using the new Object pattern:     `new $.WCServiceLocationsView( OPTIONS );`
* Using the object factory pattern: `$.WCServiceLocationsView.create( OPTIONS );`
* (Deprecated) Using the jQuery plugin pattern:  `$('#the-container').WCServiceLocationsView( OPTIONS );`

Refer to the [`ServiceLocationsView`](WC.ServiceLocationsView.html) Class documentation for the various options properties available.