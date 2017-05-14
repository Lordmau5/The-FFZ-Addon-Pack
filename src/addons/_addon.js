/* global registerAddon, api */

class Addon { // eslint-disable-line
  constructor (name) {
    this.name = name;
  }

  registerSelf () {
    registerAddon(this);
  }

  log (string, data) {
    string = '[' + this.name + '] ' + string;

    (api || console).log(string, data);
  }

  error (string, data) {
    string = '[' + this.name + '] ' + string;

    (api || console).error(string, data);
  }

  debug (string, data) {
    if (localStorage.ffz_ap_debug_mode === 'true') {
      string = '[' + this.name + '] ' + string;

      (api || console).log(string, data);
    }
  }

  extDebug (string, data) {
    if (localStorage.ffz_ap_debug_ext === 'true') {
      string = '[' + this.name + '] ' + string;

      (api || console).log(string, data);
    }
  }

  isEnabled () {
    this.extDebug('isEnabled');
    return true;
  }

  preInit () {
    this.log('Pre-initialized!');
    this.extDebug('preInit');
  }

  doSettings () {
    this.extDebug('doSettings');
  }

  init () {
    this.extDebug('init');
  }

  roomAdd (roomId) {
    this.extDebug('roomAdd', roomId);
  }

  roomRemove (roomId) {
    this.extDebug('roomRemove', roomId);
  }

  roomMessage (msg) {
    this.extDebug('roomMessage', msg);
  }

  bttvInitialized () {
    this.extDebug('bttvInitialized');
  }

  chatViewInit (dom, ember) {
    this.extDebug('chatViewInit', [dom, ember]);
  }

  chatViewDestroy (dom, ember) {
    this.extDebug('chatViewDestroy', [dom, ember]);
  }
}
