this["WC"] = this["WC"] || {};
this["WC"]["locationsTPL"] = this["WC"]["locationsTPL"] || {};

this["WC"]["locationsTPL"]["tpl-location"] = Handlebars.template({"1":function(depth0,helpers,partials,data) {
    return "color:#a0a0a0";
},"3":function(depth0,helpers,partials,data) {
    var helper;

  return "            <div>"
    + this.escapeExpression(((helper = (helper = helpers.address2 || (depth0 != null ? depth0.address2 : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"address2","hash":{},"data":data}) : helper)))
    + "</div>\n";
},"5":function(depth0,helpers,partials,data) {
    var helper;

  return "            <div>Phone: "
    + this.escapeExpression(((helper = (helper = helpers.phone || (depth0 != null ? depth0.phone : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"phone","hash":{},"data":data}) : helper)))
    + "</div>\n";
},"7":function(depth0,helpers,partials,data) {
    return "            <span>Maximum send amount of "
    + this.escapeExpression((helpers.dollar || (depth0 && depth0.dollar) || helpers.helperMissing).call(depth0,(depth0 != null ? depth0.limit : depth0),{"name":"dollar","hash":{},"data":data}))
    + "</span>\n";
},"9":function(depth0,helpers,partials,data) {
    var helper;

  return "            <button type=\"button\" class=\"btn btn-primary btn-sm btn-location\" data-id=\""
    + this.escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"id","hash":{},"data":data}) : helper)))
    + "\" style=\"margin-top:15px;\">\n                Use this location\n            </button>\n";
},"11":function(depth0,helpers,partials,data) {
    var helper;

  return "            Distance: "
    + this.escapeExpression(((helper = (helper = helpers.distance || (depth0 != null ? depth0.distance : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"distance","hash":{},"data":data}) : helper)))
    + " Miles\n";
},"13":function(depth0,helpers,partials,data) {
    var helper;

  return "            <br/>\n            Hours: "
    + this.escapeExpression(((helper = (helper = helpers.hours_of_ops || (depth0 != null ? depth0.hours_of_ops : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"hours_of_ops","hash":{},"data":data}) : helper)))
    + "\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var stack1, helper, alias1=helpers.helperMissing, alias2="function", alias3=this.escapeExpression;

  return "<div class=\"row location-row\" data-id=\""
    + alias3(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"id","hash":{},"data":data}) : helper)))
    + "\"\n     style=\"border-bottom: 1px solid #ddd;padding-bottom:10px;"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.limitLessThanAmount : depth0),{"name":"if","hash":{},"fn":this.program(1, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "\">\n    <div class=\"col-md-12\">\n        <h4>"
    + alias3(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"name","hash":{},"data":data}) : helper)))
    + "</h4>\n    </div>\n    <div class=\"col-md-7\">\n        <div>"
    + alias3(((helper = (helper = helpers.address || (depth0 != null ? depth0.address : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"address","hash":{},"data":data}) : helper)))
    + "</div>\n\n"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.address2 : depth0),{"name":"if","hash":{},"fn":this.program(3, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "\n        "
    + alias3(((helper = (helper = helpers.cityState || (depth0 != null ? depth0.cityState : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"cityState","hash":{},"data":data}) : helper)))
    + "\n\n"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.phone : depth0),{"name":"if","hash":{},"fn":this.program(5, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.limitLessThanAmount : depth0),{"name":"if","hash":{},"fn":this.program(7, data, 0),"inverse":this.program(9, data, 0),"data":data})) != null ? stack1 : "")
    + "    </div>\n    <div class=\"col-md-5\">\n"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.distance : depth0),{"name":"if","hash":{},"fn":this.program(11, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.hours_of_ops : depth0),{"name":"if","hash":{},"fn":this.program(13, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "    </div>\n</div>";
},"useData":true});

this["WC"]["locationsTPL"]["tpl-main"] = Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    return "<div class=\"row\">\n    <div class=\"col-md-12\">\n        <div class=\"maps-container\" style=\"height: 300px;width: 100%;border: 1px solid #808080\"></div>\n    </div>\n</div>\n\n<div class=\"row\" style=\"position: relative;\">\n    <div class=\"col-md-12 text-center navsection\">\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-first-page\">\n            <span class=\"glyphicon glyphicon-fast-backward\"></span>\n        </a>\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-page-back\">\n            <span class=\"glyphicon glyphicon-step-backward\"></span>\n        </a>\n\n        <span>Showing</span> <span class=\"locations-range\"></span>\n\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-page-next\">\n            <span class=\"glyphicon glyphicon-step-forward\"></span>\n        </a>\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-last-page\">\n            <span class=\"glyphicon glyphicon-fast-forward\"></span>\n        </a>\n    </div>\n\n\n    <div id=\"searchContainer\"\n         class=\"input-group col-md-3 input-group-sm\"\n         style=\"position: absolute; top: 5px; right: 15px;z-index: 999999\">\n        <input type=\"search\" class=\"form-control\" placeholder=\"Search Locations\"/>\n      <span class=\"input-group-btn\">\n        <button class=\"btn btn-default\" type=\"button\" style=\"background: #6ca7db\">Search</button>\n      </span>\n    </div>\n</div>\n\n<div class=\"row\">\n    <div class=\"col-md-12 locations-content\" style=\"position: relative\"></div>\n</div>\n\n<div class=\"row\">\n    <div class=\"col-md-12 text-center navsection\">\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-first-page\">\n            <span class=\"glyphicon glyphicon-fast-backward\"></span>\n        </a>\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-page-back\">\n            <span class=\"glyphicon glyphicon-step-backward\"></span>\n        </a>\n\n        <span>Showing</span> <span class=\"locations-range\"></span>\n\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-page-next\">\n            <span class=\"glyphicon glyphicon-step-forward\"></span>\n        </a>\n        <a href=\"#\" role=\"button\" class=\"btn btn-default btn-xs wc-last-page\">\n            <span class=\"glyphicon glyphicon-fast-forward\"></span>\n        </a>\n    </div>\n</div>";
},"useData":true});