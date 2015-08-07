define(function(require) {
  'use strict';

  var angular = require('angular');

  angular.module('paginate', [])
    .service('Paginate', ['$http', function($http) {

      function calculateRange(page, limit) {
        var start = page === 1 ? 0 : ((page - 1) * limit),
            end = start + limit - 1;
        return {
          start: start,
          end: end
        };
      }

      this.init = function(options) {
        this.url = options.url;
        this.start = options.start;
        this.limit = options.limit;
        this.page = this.page ? page : 1;

        return this;
      };

      this.search = function(term, cb) {
        this.fetch({page: 1, params: {keyword: encodeURIComponent(term)}}, cb);
      }

      this.fetch = function(opts, cb) {
        var self = this;

        var page = opts.page ? opts.page : this.page,
            range = calculateRange(page, this.limit),
            params = angular.extend(range, opts.params || {});

        $http.get(this.url, {params: params}).success(function(response){
          // expects a total property on the root response object
          self.totalRecords = response.total || 0;
          self.totalPages = Math.ceil(self.totalRecords/self.limit);
          self.currentPage = page;
          cb(response.data);
        });
        return this;
      };

      this.nextPage = function(cb) {
        var nextPage =  this.currentPage + 1;
        if(nextPage <= this.totalPages) {
          this.fetch({page: nextPage}, cb);
        }
      };

      this.lastPage = function(cb) {
        this.fetch({page: this.totalPages}, cb);
      };

      this.prevPage = function(cb) {
        var prevPage =  this.currentPage - 1;
        if(prevPage > 0) {
          this.fetch({page: prevPage}, cb);
        }
      };

      this.firstPage = function(cb) {
        this.fetch({page: 1}, cb);
      };

    }]);
})
