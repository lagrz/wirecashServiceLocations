(function (window, $) {
    'use strict';

    function template(tpl, d) {
        for (var p in d) {
            //ensure no prototype keys are used
            if (d.hasOwnProperty.call(d, p)) {
                tpl = tpl.replace(new RegExp('{' + p + '}', 'g'), d[p]);
            }
        }
        return tpl;
    }

    $.WCTemplate = template;
})(this, this.jQuery);