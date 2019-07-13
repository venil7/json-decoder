'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// import { Maybe, some, none } from "./maybe";
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
        if (Array.isArray(a)) {
            var res = [];
            for (var _i = 0, _a = a.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], index = _b[0], item = _b[1];
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
        for (var _i = 0, decoders_1 = decoders; _i < decoders_1.length; _i++) {
            var decoderTry = decoders_1[_i];
            var result = decoderTry.decode(a);
            switch (result.type) {
                case OK:
                    return ok(result.value);
                case ERR:
                    continue;
            }
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
// export const maybeDecoder = <T>(itemDecoder: Decoder<T>): Decoder<Maybe<T>> =>
//   decoder((a: unknown) => {
//     const res = oneOfDecoders(
//       nullDecoder,
//       undefinedDecoder,
//       itemDecoder
//     ).decode(a);
//     switch (res.type) {
//       case OK: {
//         switch (res.value) {
//           case undefined:
//           case null:
//             return ok(none<T>());
//           default:
//             return ok(some(res.value));
//         }
//       }
//       case ERR:
//         return err(res.message);
//     }
//   });
var exactDecoder = function (value) {
    return decoder(function (a) {
        return a === value ? ok(value) : err("not exactly " + value);
    });
};
var objectDecoder = function (decoderMap) {
    return decoder(function (a) {
        if (typeof a === "object") {
            var keys = Object.keys(decoderMap);
            var res = {};
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
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
