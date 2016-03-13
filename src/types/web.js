/**
 * Created by alex on 3/11/2016.
 */

// based on https://developers.facebook.com/docs/facebook-login/web
;(function() {

    var FB = function() {


        // Load the SDK asynchronously
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));

    };

    module.exports = FB;
})();
