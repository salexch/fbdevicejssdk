/**
 * Created by alex on 3/11/2016.
 */
/*;(function() {

    var sdk = {
        device: require('./types/device.js'),
        web: require('./types/web.js')
    };

    function autoDetect() {
        return 'web';
    }

    window.FB = {
        init: function(options) {
            if (options.sdk_type && options.sdk_type in sdk)
                sdk = sdk[options.sdk_type];
            else
                sdk = sdk[autoDetect()];

            window.FB = sdk;
            window.FB.init(options);
        }
    };
    window.fbAsyncInit();
})();*/

window.FB = require('./types/device.js');
window.fbAsyncInit();