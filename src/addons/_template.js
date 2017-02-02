var _TEMPLATE = {
  name: '_TEMPLATE',
  log: function(string, data) {
    api.log('[' + _TEMPLATE.name + '] ' + string, data);
  },
  debug: function(string, data) {
    api.log('[' + _TEMPLATE.name + ' - DEBUG] ' + string, data);
  },
  vars: {

  },
  doSettings: function() {

  },
  preinit: function() {

  },
  init: function() {
    _TEMPLATE.log('Addon initialized!');
  },
  room_add: function(room_id) {

  },
  room_remove: function(room_id) {

  },
  room_message: function(msg) {

  },
  chat_view_init: function(dom, ember) {

  },
  chat_view_destroy: function(dom, ember) {

  }
};

// registerAddon(_TEMPLATE);
