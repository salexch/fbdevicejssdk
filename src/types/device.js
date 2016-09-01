/**
 * Created by alex on 3/11/2016.
 */

//based on
//https://github.com/Thuzi/facebook-winjs-sdk/blob/master/fb.js
;(function() {

    var _ = require('lodash');
    var Q = require('q');
    var $http = require('qwest');

    var sdk_key = btoa(location.href + 'dasdas3@42543#vcxQQWsss!_ppp');
    var poll_timer;

    var FB = (function() {
        var app_id,
            scope,
            fb_api = {
                USER_LOGIN: 'https://www.facebook.com/device',
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
                    API: _.template(
                        '?fields=<%=fields %>'
                        + '&access_token=<%=access_token %>')
                }
            };

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

                if ('object' !== typeof response_body) {
                    try {
                        response_body = JSON.parse(response_body);
                    } catch (e) {}
                }

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

            poll_timer = setInterval(function() {

                $http.post(poll_url, null, {responseType : 'json'}).then(function(res) {
                    console.log('showLoginCode', res);
                    var response_body = res.response || '',
                        response_status = ~~(res.status || -1);

                    if ('object' !== typeof response_body) {
                        try {
                            response_body = JSON.parse(response_body);
                        } catch (e) {}
                    }

                    if (response_status == 200) {
                        clearInterval(poll_timer);
                        poll_timer = null;
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
                                    poll_timer = null;
                                    dfd.reject(error_message);
                                    break;
                                case 'code_expired':
                                    clearInterval(poll_timer);
                                    poll_timer = null;
                                    dfd.reject(error_message);
                                    break;
                            }
                    }
                });

            }, poll_interval);

            return dfd.promise;
        }

        function graphCall() {
            var path = arguments[0],
                method = 'get',
                params = null;

            if (arguments.length > 1 && 'string' == typeof arguments[1])
                method = arguments[1];
            else if (arguments.length > 1 && 'object' == typeof arguments[1])
                params = arguments[1];

            params = params || arguments[2] || {fields: ''};

            params.access_token = getStoredAccessToken();

            var query_string = fb_api_params_template.GRAPH.API(params);

            return $http[method](fb_api.GRAPH + path + query_string, null, {responseType : 'json'}).then(function(res) {
                var response_body = res.response || '';

                if ('object' !== typeof response_body)
                    try {
                        response_body = JSON.parse(response_body);
                    } catch (e) {}

                return Q(response_body);
            });
        }

        function storeAccessToken(access_token) {
            var storage_key = btoa(sdk_key + app_id);

            localStorage.setItem(storage_key, access_token);
        }

        function getStoredAccessToken() {
            var storage_key = btoa(sdk_key + app_id);

            return localStorage.getItem(storage_key);
        }

        function testAccessTokenValidity() {
            return graphCall('/me').then(function(res) {
                if (res)
                // Logged into your app and Facebook.
                    return Q({
                        status: 'connected'
                    });
                else
                // The person is logged into Facebook, but not your app.
                    return Q.reject({
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

                var access_token,
                    expires_in;

                getLoginCode(app_id, scope).then(function(res) {
                    cb({
                        status: 'pending',
                        authResponse: {
                            userCode: res.user_code,
                            loginUrl: fb_api.USER_LOGIN
                        }
                    });

                    return pollUserLogin(app_id, res.code, res.interval);
                }).then(function(res) {
                    access_token = res.access_token;
                    expires_in = res.expires_in;

                    storeAccessToken(access_token);

                    return graphCall('/me');
                }).then(function(res) {
                    console.log('FBSDK Login user data', res);
                    cb({
                        status: 'connected',
                        authResponse: {
                            accessToken: access_token,
                            expiresIn: expires_in,
                            signedRequest: null,
                            userID: res.id
                        }
                    });
                }).fail(function(message) {
                    cb({
                        status: message == 'authorization_declined' ? 'not_authorized' : 'unknown'
                    });
                });

            },
            cancelLogin: function() {
                var canceled = !!poll_timer;

                if (!canceled)
                    return false;

                storeAccessToken(null);
                clearInterval(poll_timer);
                poll_timer = null;

                return true;
            },
            logout: function(cb) {
                storeAccessToken(null);
                if ('function' == typeof cb)
                    cb();
            },
            getLoginStatus: function(cb) {
                testAccessTokenValidity().finally(cb);
            },
            api: function() { //path, method, params, callback
                var args = _.toArray(arguments);

                var callback = (_.filter(args, function(val) {
                    return 'function' == typeof val;
                }) || []).pop() || function() {};

                graphCall.apply(this, arguments).then(callback).catch(callback);
            },
            Event: {
                subscribe: function(event, listener) {

                }
            }
        }
    })();

    module.exports = FB;
})();
