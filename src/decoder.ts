export const OK = "OK";
export const ERR = "ERR";
export type Ok<T> = {
  type: typeof OK;
  value: T;
  map: <T2>(func: (t: T) => T2) => Result<T2>;
};
export type Err<T> = {
  type: typeof ERR;
  message: string;
  map: <T2>(func: (t: T) => T2) => Result<T2>;
};
export type Result<T> = Ok<T> | Err<T>;

export const ok = <T>(value: T): Result<T> => ({
  type: OK,
  value,
  map: func => ok(func(value))
});
export const err = <T>(message: string): Result<T> => ({
  type: ERR,
  message,
  map: func => err(message)
});

export type Decoder<T> = {
  decode: (a: unknown) => Result<T>;
  decodeAsync: (a: unknown) => Promise<T>;
  map: <T2>(func: (t: T) => T2) => Decoder<T2>;
  then: <T2>(nextDecoder: Decoder<T2>) => Decoder<T2>;
  validate: (func: (t: T) => boolean, errMessage?: string) => Decoder<T>;
};

export const decoder = <T>(decode: (a: unknown) => Result<T>): Decoder<T> => ({
  decode,
  decodeAsync: (a: unknown) =>
    new Promise<T>((accept, reject) => {
      const res = decode(a);
      switch (res.type) {
        case OK:
          return accept(res.value);
        case ERR:
          return reject(new Error(res.message));
      }
    }),
  map: <T2>(func: (t: T) => T2): Decoder<T2> =>
    decoder<T2>((b: unknown) => {
      const res = decode(b);
      switch (res.type) {
        case OK: {
          try {
            return ok(func(res.value));
          } catch (error) {
            return err(error.message);
          }
        }
        case ERR:
          return (res as unknown) as Err<T2>;
      }
    }),
  then: <T2>(nextDecoder: Decoder<T2>): Decoder<T2> =>
    allOfDecoders(decoder(decode), nextDecoder),
  validate: (
    func: (t: T) => boolean,
    errMessage: string = "validation failed"
  ): Decoder<T> =>
    decoder(decode).map<T>((t: T) => {
      if (func(t)) {
        return t;
      } else {
        throw new Error(errMessage);
      }
    })
});

type ArrayDecoder<T> = Decoder<T[]>;
type DecoderMap<T> = { [K in keyof T]: Decoder<T[K]> };

export const stringDecoder: Decoder<string> = decoder((a: unknown) =>
  typeof a === "string"
    ? ok<string>(a as string)
    : err(`expected string, got ${typeof a}`)
);

export const numberDecoder: Decoder<number> = decoder((a: unknown) =>
  typeof a === "number"
    ? ok<number>(a as number)
    : err(`expected number, got ${typeof a}`)
);

export const boolDecoder: Decoder<boolean> = decoder((a: unknown) =>
  typeof a === "boolean"
    ? ok<boolean>(a as boolean)
    : err(`expected boolean, got ${typeof a}`)
);

export const nullDecoder: Decoder<null> = decoder((a: unknown) =>
  a === null ? ok<null>(null) : err(`expected null, got ${typeof a}`)
);

export const undefinedDecoder: Decoder<undefined> = decoder((a: unknown) =>
  a === undefined
    ? ok<undefined>(undefined)
    : err(`expected undefined, got ${typeof a}`)
);

export const arrayDecoder = <T>(itemDecoder: Decoder<T>): ArrayDecoder<T> =>
  decoder((a: unknown) => {
    if (Array.isArray(a)) {
      const res: T[] = [];
      for (const [index, item] of a.entries()) {
        const itemResult = itemDecoder.decode(item);
        switch (itemResult.type) {
          case OK: {
            res.push(itemResult.value);
            continue;
          }
          case ERR:
            return err(`array item ${index}: ${itemResult.message}`);
        }
      }
      return ok(res);
    } else return err(`expected array, got ${typeof a}`);
  });

export const oneOfDecoders = <T>(...decoders: Decoder<T>[]): Decoder<T> =>
  decoder((a: unknown) => {
    for (const decoderTry of decoders) {
      const result = decoderTry.decode(a);
      switch (result.type) {
        case OK:
          return ok(result.value);
        case ERR:
          continue;
      }
    }
    return err(`one of: none of decoders match`);
  });

type LastElem<T extends number> = [-1, 0, 1, 2, 3, 4, 5][T];
type LastElemType<T extends unknown[]> = T[LastElem<T["length"]>];
type LastDecoder<T extends Decoder<unknown>[]> = LastElemType<
  T
> extends Decoder<infer R>
  ? R
  : T[0];

export const allOfDecoders = <
  TDecoders extends Decoder<unknown>[],
  R = LastDecoder<TDecoders>
>(
  ...decoders: TDecoders
): Decoder<R> =>
  decoder((a: unknown) => {
    return decoders.reduce(
      (result: Result<R>, decoderNext: Decoder<unknown>) => {
        switch (result.type) {
          case OK:
            return decoderNext.decode(result.value) as Result<R>;
          default:
            return err<R>(result.message);
        }
      },
      ok<R>(a as R)
    );
  });

export const exactDecoder = <T>(value: T): Decoder<T> =>
  decoder((a: unknown) =>
    a === value ? ok(value) : err(`not exactly ${value}`)
  );

export const objectDecoder = <T>(decoderMap: DecoderMap<T>): Decoder<T> =>
  decoder((a: unknown) => {
    if (typeof a === "object") {
      const keys = Object.keys(decoderMap) as (keyof T)[];
      const res: Partial<T> = {};
      for (const key of keys) {
        const fieldResult = decoderMap[key].decode(((a as unknown) as T)[key]);
        switch (fieldResult.type) {
          case OK: {
            res[key] = fieldResult.value;
            continue;
          }
          case ERR:
            return err(`${key}: ${fieldResult.message}`);
        }
      }
      return ok(res as T);
    } else return err(`expected object, got ${typeof a}`);
  });

export const anyDecoder: Decoder<unknown> = decoder((a: unknown) => ok(a));

export const valueDecoder = <T>(value: T): Decoder<T> =>
  decoder((a: unknown) => ok(value));

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
