/**
 * Created by alex on 3/11/2016.
 */

var FacebookSDK = function(sdk_type) {
    sdk_type = sdk_type || 'web'; // 'web', 'device'

    if (sdk_type == 'web')
        require('./types/web.js')();
    else if (sdk_type == 'device') {
        window.FB = require('./types/device.js');
    } else
        console.log('FB SDK type not found');

};