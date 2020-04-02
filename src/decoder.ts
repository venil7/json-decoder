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
  map: func => {
    try {
      return ok(func(value));
    } catch (error) {
      return err(error.message);
    }
  }
});
export const err = <T>(message: string): Result<T> => ({
  type: ERR,
  message,
  map: () => err(message)
});

export type Decoder<T> = {
  decode: (a: unknown) => Result<T>;
  decodeAsync: (a: unknown) => Promise<T>;
  map: <T2>(func: (t: T) => T2) => Decoder<T2>;
  then: <T2>(nextDecoder: Decoder<T2>) => Decoder<T2>;
  validate: (
    func: (t: T) => boolean,
    errMessage?: string | ((t: T) => string)
  ) => Decoder<T>;
};

export type DecoderType<D> = D extends Decoder<infer T> ? T : never;
export type ArrayType<A> = A extends Array<infer T> ? T : never;
export type DecoderArrayType<DD> = DecoderType<ArrayType<DD>>;

export const decoder = <T>(decode: (a: unknown) => Result<T>): Decoder<T> => ({
  decode,
  decodeAsync: a =>
    new Promise<T>((resolve, reject) => {
      const res = decode(a);
      switch (res.type) {
        case OK:
          return resolve(res.value);
        case ERR:
          return reject(new Error(res.message));
      }
    }),
  map: <T2>(func: (t: T) => T2): Decoder<T2> =>
    decoder<T2>((b: unknown) => decode(b).map(func)),
  then: <T2>(nextDecoder: Decoder<T2>): Decoder<T2> =>
    allOfDecoders(decoder(decode), nextDecoder),
  validate: (func, errMessage = "validation failed"): Decoder<T> =>
    decoder(decode).map<T>((t: T) => {
      if (func(t)) {
        return t;
      } else {
        throw new Error(
          typeof errMessage === "function" ? errMessage(t) : errMessage
        );
      }
    })
});

type ArrayDecoder<T> = Decoder<T[]>;
type DecoderMap<T> = { [K in keyof T]: Decoder<T[K]> };

export const stringDecoder: Decoder<string> = decoder(a =>
  typeof a === "string"
    ? ok<string>(a as string)
    : err(`expected string, got ${typeof a}`)
);

export const symbolDecoder: Decoder<symbol> = decoder(a =>
  typeof a === "symbol"
    ? ok<symbol>(a as symbol)
    : err(`expected symbol, got ${typeof a}`)
);

export const numberDecoder: Decoder<number> = decoder(a =>
  typeof a === "number"
    ? ok<number>(a as number)
    : err(`expected number, got ${typeof a}`)
);

export const boolDecoder: Decoder<boolean> = decoder(a =>
  typeof a === "boolean"
    ? ok<boolean>(a as boolean)
    : err(`expected boolean, got ${typeof a}`)
);

export const nullDecoder: Decoder<null> = decoder(a =>
  a === null ? ok<null>(null) : err(`expected null, got ${typeof a}`)
);

export const undefinedDecoder: Decoder<undefined> = decoder(a =>
  a === undefined
    ? ok<undefined>(undefined)
    : err(`expected undefined, got ${typeof a}`)
);

export const arrayDecoder = <T>(itemDecoder: Decoder<T>): ArrayDecoder<T> =>
  decoder((a: unknown) => {
    if (!Array.isArray(a)) return err(`expected array, got ${typeof a}`);

    const res: T[] = [];

    for (let index = 0; index < a.length; index++) {
      const item = a[index];
      const itemResult = itemDecoder.decode(item);

      if (itemResult.type === ERR)
        return err(`array item ${index}: ${itemResult.message}`);

      res.push(itemResult.value);
    }
    return ok(res);
  });

export const oneOfDecoders = <T = unknown>(
  ...decoders: Decoder<T>[]
): ArrayType<typeof decoders> =>
  decoder((a: unknown) => {
    for (const decoderTry of decoders) {
      const result = decoderTry.decode(a);
      if (result.type === OK) return ok(result.value);
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
      (result: Result<R>, decoderNext: Decoder<unknown>) =>
        result.type === OK
          ? (decoderNext.decode(result.value) as Result<R>)
          : err<R>(result.message),
      ok<R>(a as R)
    );
  });

export const exactDecoder = <T>(value: T): Decoder<T> =>
  Number.isNaN(value as any)
    ? decoder((a: unknown) =>
        Number.isNaN(a as any) ? ok(value) : err(`not exactly ${value}`)
      )
    : decoder((a: unknown) =>
        a === value ? ok(value) : err(`not exactly ${value}`)
      );

export const objectDecoder = <T>(decoderMap: DecoderMap<T>): Decoder<T> =>
  decoder((a: unknown) => {
    if (typeof a !== "object") return err(`expected object, got ${typeof a}`);
    if (!a) return err(`expect object, got ${a}`);

    const keys = Object.keys(decoderMap) as (keyof T)[];
    const res: Partial<T> = {};
    for (const key of keys) {
      const fieldResult = decoderMap[key].decode(((a as unknown) as T)[key]);

      if (fieldResult.type === ERR)
        return err(`${key}: ${fieldResult.message}`);

      res[key] = fieldResult.value;
    }

    return ok(res as T);
  });

export const anyDecoder: Decoder<unknown> = decoder((a: unknown) => ok(a));

export const valueDecoder = <T>(value: T): Decoder<T> =>
  decoder((a: unknown) => ok(value));
