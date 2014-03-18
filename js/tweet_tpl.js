(function (window, $) {
    'use strict';
    function template(tpl, d) {
        for (var p in d){
            if(d.hasOwnProperty(p)){
                tpl = tpl.replace(new RegExp('{' + p + '}', 'g'), d[p]);
            }
        }
        return tpl;
    }

    $.template = template;
})(this, this.jQuery);