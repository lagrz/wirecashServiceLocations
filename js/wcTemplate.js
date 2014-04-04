(function (window, $) {
    'use strict';

    /**
     * Super tiny and super simple template engine
     * @param {string} tpl The template string to be used. Template keys require encapsulation: {key}
     * @param {object} d The data object used for the template.
     * @returns {string} Result from combining the data with the template
     * @memberOf WC
     */
    function template(tpl, d) {
        for (var p in d) {
            //ensure no prototype keys are used
            if (d.hasOwnProperty.call(d, p)) {
                tpl = tpl.replace(new RegExp('{' + p + '}', 'g'), d[p]);
            }
        }
        return tpl;
    }

    if (!window.hasOwnProperty('WC')) {
        window.WC = {};
    }

    window.WC.template = template;

    $.WCTemplate = template;

})(this, this.jQuery);