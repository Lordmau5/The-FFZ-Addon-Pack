var _TEMPLATE = {
  name: '_TEMPLATE',
  log: function(string) {
    api.log('[' + _TEMPLATE.name + '] ' + string);
  },
  doSettings: function() {

  },
  init: function() {
    _TEMPLATE.log('Addon initialized!');
  },
  room_message: function(msg) {

  },
  room_add: function(room_id, reg_function, attempts) {

  },
  chat_view_init: function(dom, ember) {

  },
  chat_view_destroy: function(dom, ember) {

  }
};

// registerAddon(_TEMPLATE);
