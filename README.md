Wirecash Service Locations Class
====================================
[![Build Status](http://ci.lagrz.com/lagrz/atmc_service_locations/badge)](http://ci.lagrz.com/lagrz/atmc_service_locations/)

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
* Using the jQuery plugin pattern:  `$('#the-container').WCServiceLocationsView( OPTIONS );`

All of these forms of instantiation require that you provide an object as a parameter containing the following:

    AVAILABLE OPTIONS:
    ------------------
    container           The main container element must be a valid jQuery object,
                        if using the jQuery plugin pattern you can omit this

    tplMain             The main container template, can be either string or a valid
                        html / jQuery element.

                        It MUST contain at least an element with the following:
                            - Whatever class defined for option 'mapContainer', default: '.wc-map-container'
                            - Whatever class defined for option 'contentContainer', default: '.wc-content-container'

                        The following are optional, but required for pagination:
                            - Whatever class defined for option 'pageFirst', default: '.wc-first-page'
                            - Whatever class defined for option 'pageLast', default: '.wc-last-page'
                            - Whatever class defined for option 'pageNext', default: '.wc-page-next'
                            - Whatever class defined for option 'pageBack', default: '.wc-page-back'

    tplLocation         The template that generates each location record, must be a string
                        Can have any of the following keys:
                            {address}
                            {agentCode}
                            {lat}
                            {lng}
                            {country}
                            {currency}
                            {distance}
                            {hours}
                            {name}
                            {phone}

    tplNoData           The template that is displayed in case no data is returned from the
                        server or an ajax error occurred, can be string / html / jQuery

    tplLoading          The template that is displayed while the ajax call is running, can be
                        string / html / jQuery

    pagerShowPerPage    [DEFAULT: 5] The number of records to show per page, must be a number

    pagerTotalRecords   The total number of records available, must be a number

    pagerRecordsUrl     The URL that we will be calling via ajax to grab the records

    pagerRecordsParams  An object used to add additional params for each request to the server

    mapsAPIKey          The google maps API key

    pageFirst           [DEFAULT: '.wc-first-page', notice the '.' its a selector] Specify the
                        selector for the paginator first page button

    pageLast            [DEFAULT: '.wc-last-page', notice the '.' its a selector] Specify the
                        selector for the paginator last page button

    pageNext            [DEFAULT: '.wc-page-next', notice the '.' its a selector] The selector
                        for the paginator for the next page button

    pageBack            [DEFAULT: '.wc-page-back', notice the '.' its a selector] The selector
                        for the paginator for the back page button

    mapContainer        [DEFAULT: '.wc-map-container', notice the '.' its a selector] The
                        selector for the Google maps canvas container

    contentContainer    [DEFAULT: '.wc-content-container', notice the '.' its a selector] The
                        selector for service locations container

    pageEnable          [DEFAULT: 'wc-enable'] A css class that is added when a paginator
                        button is enabled

    pageDisable         [DEFAULT: 'wc-disable'] A css class that is added when a paginator
                        button is disabled

    recordActive        [DEFAULT: 'wc-active'] A css class that is toggled when a map
                        marker gets a mouseover / mouseout event

Available Methods using the jQuery pattern:

    $('container').WCServiceLocationsView( 'METHOD' )

    METHODS:
    ------------------
    first                Calls the paginator to move to the first page
    last                 Calls the paginator to move to the last page
    next                 Calls the paginator to move to the next page
    back                 Calls the paginator to move to the previous page
    totalPages           Returns the total number of pages available
    currentPage          Returns the current page number
    getCurrentPageData   Returns an array with `ServiceLocation` objects in it


jQuery listenable events triggered on the container element:

    $('container').on( 'EVENT' );

    EVENTS:
    ------------------
    WCService:create        Triggered when the UI is created
    WCService:beforePage    Triggered before creating a list of records
    WCService:onPage        Triggered after creating a list of records
    WCService:onData        Triggered when ajax call received data
    WCService:onLoading     Triggered when ajax call is loading
    WCService:onNoData      Triggered when ajax call returned no data
    WCService:onFirstRun    Triggered when initial ajax call is complete (when it got the first page of data)

### Note:
This class uses pagination, therefore requires that the backend server supports `POST` requests with these base parameters:

* `start` : The record we inclusively start counting at, on first page its 0
* `end`   : The record we inclusively stop counting, if `pagerShowPerPage` option is set to 5 this will equal to 4 on first page request