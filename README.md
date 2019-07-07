# TypeScript JSON Decoder: `json-decoder`

[![Build Status](https://travis-ci.org/venil7/json-decoder.svg?branch=master)](https://travis-ci.org/venil7/json-decoder) [![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

**`json-decoder`** is a type safe compositional JSON decoder for `TypeScript`. It is heavily inspired by [Elm](https://package.elm-lang.org/packages/elm/json/latest/) and [ReasonML](https://github.com/glennsl/bs-json) JSON decoders. The code is loosely based on [ts.data.json](https://github.com/joanllenas/ts.data.json) but is a full rewrite, and does not rely on unsafe `any` type.

## Compositional decoding

The decoder comprises of small basic building blocks (listed below), that can be composed into JSON decoders of any complexity, including deeply nested structures, heterogenous arrays, etc. If a type can be expressed as `TypeScript` `interface` or `type` (including algebraic data types) - it can be safely decoded and type checked with `json-decoder`.

## Basic decoders

Below is a list of basic decoders supplied with `json-decoder`:

- `stringDecoder` - decodes a string:

  ```
  let result: Result<string> = stringDecoder.decode("some string"); //Ok("some string");
  let result: Result<string> = stringDecoder.decode(123.45); //Err("string expected");
  ```

- `numberDecoder` - decodes a number:

  ```
  let result: Result<number> = numberDecoder.decode(123.45); //Ok(123.45);
  let result: Result<number> = numberDecoder.decode("some string"); //Err("number expected");
  ```

- `boolDecoder` - decodes a boolean:

  ```
  let result: Result<boolean> = boolDecoder.decode(true); //Ok(true);
  let result: Result<boolean> = boolDecoder.decode(null); //Err("bool expected");
  ```

- `nullDecoder` - decodes a `null` value:

  ```
  let result: Result<null> = nullDecoder.decode(null); //Ok(null);
  let result: Result<null> = boolDecoder.decode(false); //Err("null expected");
  ```

- `undefinedDecoder` - decodes an `undefined` value:

  ```
  let result: Result<null> = nullDecoder.decode(undefined); //Ok(undefined);
  let result: Result<null> = boolDecoder.decode(null); //Err("undefined expected");
  ```

- `arrayDecoder<T>(decoder: Decoder<T>)` - decodes an array, requires one parameter of array item decoder:

  ```
  let result: Result<number[]> = arrayDecoder.decode([1,2,3]); //Ok([1,2,3]);
  let result: Result<number[]> = arrayDecoder.decode("some string"); //Err("array expected");
  let result: Result<number[]> = arrayDecoder.decode([true, false, null]); //Err("array: number expected");
  ```

- `objectDecoder<T>(decoderMap: DecoderMap<T>)` - decodes an object, requires a decoder map parameter. Decoder map is a composition of decoders, one for each field of an object, that themselves can be object decoders if neccessary.

  ```
  type Pet = {name: string, age: number};
  let petDecoder = objectDecoder<Person>({
    name: stringDecoder,
    age: numberDecoder,
  });
  let result: Result<Pet> = petDecoder.decode({name: "Varia", age: 0.5}); //Ok({name: "Varia", age: 0.5});
  let result: Result<Pet> = petDecoder.decode({name: "Varia", type: "cat"}); //Err("name: string expected");

  let petDecoder = objectDecoder<Person>({
    name: stringDecoder,
    type: stringDecoder, //<-- error: field type id not defined in Pet
  });
  ```

- `exactDecoder<T>(value: T)` - decodes a value that is passed as a parameter. Any other value will result in `Err`:

  ```
  let catDecoder = exactDecoder("cat");
  let result: Result<"cat"> = catDecoder.decode("cat"); //Ok("cat");
  let result: Result<"cat"> = catDecoder.decode("dog"); //Err("cat expected");
  ```

- `oneOfDecoders<T1|T2...Tn>(...decoders: Decoder<T1|T2...Tn>[])` - takes a number decoders as parameter and tries to decode a value with each in sequence, returns as soon as one succeeds, errors otherwise. Useful for algebraic data types.

  ```
  let catDecoder = exactDecoder("cat");
  let dogDecoder = exactDecoder("dog");
  let petDecoder = oneOfDecoders<"cat"|"dog"> = oneOfDecoders(catDecoder, dogDecoder);

  let result: Result<"cat"|"dog"> = petDecoder.decode("cat"); //Ok("cat");
  let result: Result<"cat"|"dog"> = petDecoder.decode("dog"); //Ok("dog");
  let result: Result<"cat"|"dog"> = petDecoder.decode("giraffe"); //Err("none of decoders matched");
  ```

## API

## Monadic result and pattern matching

## Friendly errors

## Mapping and type conversion

## Validation
