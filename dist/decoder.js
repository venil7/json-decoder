'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

var OK = "OK";
var ERR = "ERR";
var ok = function (value) { return ({
    type: OK,
    value: value,
    map: function (func) { return ok(func(value)); }
}); };
var err = function (message) { return ({
    type: ERR,
    message: message,
    map: function (func) { return err(message); }
}); };
var decoder = function (decode) { return ({
    decode: decode,
    decodeAsync: function (a) {
        return new Promise(function (accept, reject) {
            var res = decode(a);
            switch (res.type) {
                case OK:
                    return accept(res.value);
                case ERR:
                    return reject(new Error(res.message));
            }
        });
    },
    map: function (func) {
        return decoder(function (b) {
            var res = decode(b);
            switch (res.type) {
                case OK:
                    return ok(func(res.value));
                case ERR:
                    return res;
            }
        });
    },
    then: function (nextDecoder) {
        return allOfDecoders(decoder(decode), nextDecoder);
    }
}); };
var stringDecoder = decoder(function (a) {
    return typeof a === "string"
        ? ok(a)
        : err("expected string, got " + typeof a);
});
var numberDecoder = decoder(function (a) {
    return typeof a === "number"
        ? ok(a)
        : err("expected number, got " + typeof a);
});
var boolDecoder = decoder(function (a) {
    return typeof a === "boolean"
        ? ok(a)
        : err("expected boolean, got " + typeof a);
});
var nullDecoder = decoder(function (a) {
    return a === null ? ok(null) : err("expected null, got " + typeof a);
});
var undefinedDecoder = decoder(function (a) {
    return a === undefined
        ? ok(undefined)
        : err("expected undefined, got " + typeof a);
});
var arrayDecoder = function (itemDecoder) {
    return decoder(function (a) {
        var e_1, _a;
        if (Array.isArray(a)) {
            var res = [];
            try {
                for (var _b = __values(a.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), index = _d[0], item = _d[1];
                    var itemResult = itemDecoder.decode(item);
                    switch (itemResult.type) {
                        case OK: {
                            res.push(itemResult.value);
                            continue;
                        }
                        case ERR:
                            return err("array item " + index + ": " + itemResult.message);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return ok(res);
        }
        else
            return err("expected array, got " + typeof a);
    });
};
var oneOfDecoders = function () {
    var decoders = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        decoders[_i] = arguments[_i];
    }
    return decoder(function (a) {
        var e_2, _a;
        try {
            for (var decoders_1 = __values(decoders), decoders_1_1 = decoders_1.next(); !decoders_1_1.done; decoders_1_1 = decoders_1.next()) {
                var decoderTry = decoders_1_1.value;
                var result = decoderTry.decode(a);
                switch (result.type) {
                    case OK:
                        return ok(result.value);
                    case ERR:
                        continue;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (decoders_1_1 && !decoders_1_1.done && (_a = decoders_1["return"])) _a.call(decoders_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return err("one of: none of decoders match");
    });
};
var allOfDecoders = function () {
    var decoders = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        decoders[_i] = arguments[_i];
    }
    return decoder(function (a) {
        return decoders.reduce(function (result, decoderNext) {
            switch (result.type) {
                case OK:
                    return decoderNext.decode(result.value);
                default:
                    return err(result.message);
            }
        }, ok(a));
    });
};
var exactDecoder = function (value) {
    return decoder(function (a) {
        return a === value ? ok(value) : err("not exactly " + value);
    });
};
var objectDecoder = function (decoderMap) {
    return decoder(function (a) {
        var e_3, _a;
        if (typeof a === "object") {
            var keys = Object.keys(decoderMap);
            var res = {};
            try {
                for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                    var key = keys_1_1.value;
                    var fieldResult = decoderMap[key].decode(a[key]);
                    switch (fieldResult.type) {
                        case OK: {
                            res[key] = fieldResult.value;
                            continue;
                        }
                        case ERR:
                            return err(key + ": " + fieldResult.message);
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (keys_1_1 && !keys_1_1.done && (_a = keys_1["return"])) _a.call(keys_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return ok(res);
        }
        else
            return err("expected object, got " + typeof a);
    });
};

exports.ERR = ERR;
exports.OK = OK;
exports.allOfDecoders = allOfDecoders;
exports.arrayDecoder = arrayDecoder;
exports.boolDecoder = boolDecoder;
exports.decoder = decoder;
exports.err = err;
exports.exactDecoder = exactDecoder;
exports.nullDecoder = nullDecoder;
exports.numberDecoder = numberDecoder;
exports.objectDecoder = objectDecoder;
exports.ok = ok;
exports.oneOfDecoders = oneOfDecoders;
exports.stringDecoder = stringDecoder;
exports.undefinedDecoder = undefinedDecoder;
//# sourceMappingURL=decoder.js.map
