(function (window, $) {
    'use strict';

    /**
     * Super tiny and super simple template engine
     * @param {string} tpl The template string to be used. Template keys require encapsulation: {key}
     * @param {object} data The data object used for the template.
     * @returns {string} Result from combining the data with the template
     * @memberOf WC
     */
    function template(tpl, data) {
        for (var p in data) {
            //ensure no prototype keys are used
            if (data.hasOwnProperty.call(data, p)) {
                tpl = tpl.replace(new RegExp('{' + p + '}', 'g'), data[p]);
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