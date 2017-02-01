function inject() {
  var script = document.createElement('script');
  script.type = 'text/javascript';

  if(localStorage.ffz_ap_debug_mode) {
    var xhr = new XMLHttpRequest();
		xhr.open('GET', '//localhost:3000/', true);
		xhr.onload = function(e) {
      console.log('FFZ:AP: Development Server is present.');
			script.src = '//localhost:3000/ffz-ap.js';
			document.body.classList.add('ffz-ap-dev');
			document.head.appendChild(script);
    };
    xhr.onerror = function(e) {
      console.log('FFZ:AP: Development Server is not present. Using CDN.');
			script.src = '//lordmau5.com/nocache/ffz-ap/ffz-ap.min.js?_=' + Date.now();
			document.head.appendChild(script);
    };
    return xhr.send(null);
  }

  script.src = '//cdn.lordmau5.com/ffz-ap/ffz-ap.min.js';
	document.head.appendChild(script);
}

inject();
