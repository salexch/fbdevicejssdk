/**
 * Created by alex on 3/11/2016.
 */

//based on
//https://github.com/Thuzi/facebook-winjs-sdk/blob/master/fb.js
;(function() {

    var _ = require('lodash');
    var Q = require('q');
    var $http = require('qwest');

    var sdk_key = 'dasdas3@42543#vcxQQWsss!_ppp';

    var FB = (function() {
        var app_id,
            scope,
            fb_api = {
                DEVICE: 'https://graph.facebook.com/oauth/device?',
                POLL: 'https://graph.facebook.com/oauth/device?',
                GRAPH: 'https://graph.facebook.com/v2.3'
            },
            fb_api_params_template = {
                DEVICE: _.template(
                    'type=device_code'
                    + '&client_id=<%=APP_ID %>'
                    + '&scope=<%=scope.join(\',\') %>'),
                POLL: _.template(
                    'type=device_token'
                    + '&client_id=<%=APP_ID %>'
                    + '&code=<%=code %>'),
                GRAPH: {
                    ME: _.template(
                        '/me?fields=<%=fields.join(\',\') %>'
                        + '&access_token=<%=access_token %>')
                }
            };

/*        var graph = function () {
            var   args = Array.prototype.slice.call(arguments)
                , path = args.shift()
                , next = args.shift()
                , method
                , params
                , cb;

            while (next) {
                var type = typeof next;
                if (type === 'string' && !method) {
                    method = next.toLowerCase();
                } else if (type === 'function' && !cb) {
                    cb = next;
                } else if (type === 'object' && !params) {
                    params = next;
                } else {
                    log('Invalid argument passed to FB.api(): ' + next);
                    return;
                }
                next = args.shift();
            };

            method = method || 'get';
            params = params || {};

            // remove prefix slash if one is given, as it's already in the base url
            if (path[0] === '/') {
                path = path.substr(1);
            }

            if (METHODS.indexOf(method) < 0) {
                log('Invalid method passed to FB.api(): ' + method);
                return;
            }

            oauthRequest('graph', path, method, params, cb);
        };*/

        function getLoginCode(app_id, scope) {
            var dfd = Q.defer();

            var params = fb_api_params_template.DEVICE({
                APP_ID: app_id,
                scope: scope
            });

            $http.post(fb_api.DEVICE + params, null, {responseType : 'json'}).then(function(res) {
                console.log('showLoginCode', res);
                var response_body = res.response || '',
                    response_status = ~~(res.status || -1);

                if (response_status == 200 && 'object' == typeof response_body) //TODO check fields
                    dfd.resolve(response_body);
                else
                    dfd.reject('no data');
            }).catch(dfd.reject);

            return dfd.promise;
        }


        function pollUserLogin(app_id, code, poll_interval) {
            var dfd = Q.defer();

            var params = fb_api_params_template.POLL({
                APP_ID: app_id,
                code: code
            });

            var poll_url = fb_api.POLL + params;

            poll_interval = poll_interval * 1000;

            var poll_timer = setInterval(function() {

                $http.post(poll_url, null, {responseType : 'json'}).then(function(res) {
                    console.log('showLoginCode', res);
                    var response_body = res.response || '',
                        response_status = ~~(res.status || -1);

                    if (response_status == 200) {
                        clearInterval(poll_timer);
                        dfd.resolve(response_body);
                    } else if (response_status == 400) {
                        var error_type,
                            error_message;
                        try {
                            error_type = response_body.error.type;
                            error_message = response_body.error.message;
                        } catch (e) {}

                        if (error_type == 'OAuthException')
                            switch (error_message) {
                                case 'authorization_declined':
                                    clearInterval(poll_timer);
                                    dfd.reject();
                                    break;
                                case 'code_expired':
                                    clearInterval(poll_timer);
                                    dfd.reject();
                                    break;
                            }
                    }
                });

            }, poll_interval);
        }

        function getUserInfo(fields, access_token) {
            var params = fb_api_params_template.GRAPH.ME({
                fields: fields,
                access_token: access_token
            });


            return $http.post(fb_api.GRAPH + params, null, {responseType : 'json'}).then(function(res) {
                var response_body = res.response || '';

                return Q(response_body);
            });
        }


        function storeAccessToken(access_token) {
            var storage_key = btoa(sdk_key + api_key);

            localStorage.setItem(storage_key, access_token);
        }

        function getStoredAccessToken() {
            var storage_key = btoa(sdk_key + api_key);

            return localStorage.getItem(storage_key);
        }

        function testAccessTokenValidity() {
            return getUserInfo(['name'], getStoredAccessToken()).then(function(res) {
                if (res)
                // Logged into your app and Facebook.
                    return Q({
                        status: 'connected'
                    });
                else
                // The person is logged into Facebook, but not your app.
                    return Q({
                        status: 'not_authorized'
                    });

                // The person is not logged into Facebook, so we're not sure if
                // they are logged into this app or not.
            });
        }

        return {
            init: function(obj) {
                app_id = obj.appId;
            },
            login: function(cb, options) {
                options = options || {};
                scope = _.compact((options.scope || '').split(','));

                getLoginCode(app_id, scope).then(function(res) {
                    cb({
                        status: 'waiting',
                        user_code: res.user_code
                    });

                    pollUserLogin(app_id, res.code, res.interval).then(function(res) {
                        storeAccessToken(res.access_token);
                        cb(res);
                    });
                });

            },
            cancelLogin: function() {
                //1. stop polling
            },
            logout: function(cb) {
                storeAccessToken(null);
                if ('function' == typeof cb)
                    cb();
            },
            getLoginStatus: function(cb) {
                testAccessTokenValidity().then(cb);
            },
            api: function() {
/*                if (typeof arguments[0] === 'string') {
                    graph.apply(this, arguments);
                } else {
                    rest.apply(this, arguments);
                }*/
            },
            Event: {
                subscribe: function(event, listener) {

                }
            }
        }
    })();

    module.exports = FB;
})();
