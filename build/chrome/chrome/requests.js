chrome.webRequest.onHeadersReceived.addListener(function(info) {
    return {
        responseHeaders: info.responseHeaders.concat([{
            name: 'access-control-allow-origin',
            value: '*'
        }])
    };
}, {
    urls: [
        "*://cdn.betterttv.net/*",
        "*://cdn.lordmau5.com/*"
    ]
}, ["blocking", "responseHeaders"]);
