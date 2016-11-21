var GameWisp = {
  name: "GameWisp",
  log: function(string) {
    api.log("[" + GameWisp.name + "] " + string);
  },
  init: function() {
    console.log("[GameWisp] Addon initialized!");
  },
  doSettings: function() {

  },
  room_message: function(msg) {

  },
  room_add: function(room_id, reg_function, attempts) {

  },
  chat_view_init: function(dom, ember) {
    // Unused
  },
  chat_view_destroy: function(dom, ember) {
    // Unused
  }
};

registerAddon(GameWisp);
