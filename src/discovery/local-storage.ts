/* eslint-disable prefer-const */
//参考 node-localStorage
//去除String限制
'use strict';

let db;
let serviceLocalStorage;

// eslint-disable-next-line @typescript-eslint/no-empty-function
function LocalStorage() {}
db = LocalStorage;

db.prototype.getItem = function (key) {
    if (this.hasOwnProperty(key)) {
        return this[key];
    }
    return null;
};

db.prototype.setItem = function (key, val) {
    this[key] = val;
};

db.prototype.removeItem = function (key) {
    delete this[key];
};

db.prototype.clear = function () {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let self = this;
    Object.keys(self).forEach(function (key) {
        self[key] = undefined;
        delete self[key];
    });
};

db.prototype.key = function (i) {
    i = i || 0;
    return Object.keys(this)[i];
};

db.prototype.__defineGetter__('length', function () {
    return Object.keys(this).length;
});

if (global.localStorage) {
    serviceLocalStorage = localStorage;
} else {
    serviceLocalStorage = new LocalStorage();
}

export default serviceLocalStorage;
