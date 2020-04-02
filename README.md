# TypeScript JSON Decoder: `json-decoder`

**`json-decoder`** is a type safe compositional JSON decoder for `TypeScript`. It is heavily inspired by [Elm](https://package.elm-lang.org/packages/elm/json/latest/) and [ReasonML](https://github.com/glennsl/bs-json) JSON decoders. The code is loosely based on [ts.data.json](https://github.com/joanllenas/ts.data.json) but is a full rewrite, and does not rely on unsafe `any` type.

[![Build Status](https://travis-ci.org/venil7/json-decoder.svg?branch=master)](https://travis-ci.org/venil7/json-decoder) [![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

Give us a 🌟on Github

## Compositional decoding

The decoder comprises of small basic building blocks (listed below), that can be composed into JSON decoders of any complexity, including deeply nested structures, heterogenous arrays, etc. If a type can be expressed as `TypeScript` `interface` or `type` (including algebraic data types) - it can be safely decoded and type checked with `json-decoder`.

## Install (npm or yarn)

```
  $> npm install json-decoder
  $> yarn add json-decoder
```

## Basic decoders

Below is a list of basic decoders supplied with `json-decoder`:

- `stringDecoder` - decodes a string:

  ```TypeScript
  const result: Result<string> = stringDecoder.decode("some string"); //Ok("some string");
  const result: Result<string> = stringDecoder.decode(123.45); //Err("string expected");
  ```

- `numberDecoder` - decodes a number:

  ```TypeScript
  const result: Result<number> = numberDecoder.decode(123.45); //Ok(123.45);
  const result: Result<number> = numberDecoder.decode("some string"); //Err("number expected");
  ```

- `boolDecoder` - decodes a boolean:

  ```TypeScript
  const result: Result<boolean> = boolDecoder.decode(true); //Ok(true);
  const result: Result<boolean> = boolDecoder.decode(null); //Err("bool expected");
  ```

- `nullDecoder` - decodes a `null` value:

  ```TypeScript
  const result: Result<null> = nullDecoder.decode(null); //Ok(null);
  const result: Result<null> = boolDecoder.decode(false); //Err("null expected");
  ```

- `undefinedDecoder` - decodes an `undefined` value:

  ```TypeScript
  const result: Result<null> = nullDecoder.decode(undefined); //Ok(undefined);
  const result: Result<null> = boolDecoder.decode(null); //Err("undefined expected");
  ```

- `arrayDecoder<T>(decoder: Decoder<T>)` - decodes an array, requires one parameter of array item decoder:

  ```TypeScript
  const numberArrayDecoder = arrayDecoder(numberDecoder);
  const result: Result<number[]> = numberArrayDecoder.decode([1,2,3]); //Ok([1,2,3]);
  const result: Result<number[]> = numberArrayDecoder.decode("some string"); //Err("array expected");
  const result: Result<number[]> = numberArrayDecoder.decode([true, false, null]); //Err("array: number expected");
  ```

- `objectDecoder<T>(decoderMap: DecoderMap<T>)` - decodes an object, requires a decoder map parameter. Decoder map is a composition of decoders, one for each field of an object, that themselves can be object decoders if neccessary.

  ```TypeScript
  type Pet = {name: string, age: number};
  const petDecoder = objectDecoder<Pet>({
    name: stringDecoder,
    age: numberDecoder,
  });
  const result: Result<Pet> = petDecoder.decode({name: "Varia", age: 0.5}); //Ok({name: "Varia", age: 0.5});
  const result: Result<Pet> = petDecoder.decode({name: "Varia", type: "cat"}); //Err("name: string expected");

  const petDecoder = objectDecoder<Pet>({
    name: stringDecoder,
    type: stringDecoder, //<-- error: field type is not defined in Pet
  });
  ```

- `exactDecoder<T>(value: T)` - decodes a value that is passed as a parameter. Any other value will result in `Err`:

  ```TypeScript
  const catDecoder = exactDecoder("cat");
  const result: Result<"cat"> = catDecoder.decode("cat"); //Ok("cat");
  const result: Result<"cat"> = catDecoder.decode("dog"); //Err("cat expected");
  ```

- `oneOfDecoders<T1|T2...Tn>(...decoders: Decoder<T1|T2...Tn>[])` - takes a number decoders as parameter and tries to decode a value with each in sequence, returns as soon as one succeeds, errors otherwise. Useful for algebraic data types.

  ```TypeScript
  const catDecoder = exactDecoder("cat");
  const dogDecoder = exactDecoder("dog");
  const petDecoder = oneOfDecoders<"cat"|"dog"> = oneOfDecoders(catDecoder, dogDecoder);

  const result: Result<"cat"|"dog"> = petDecoder.decode("cat"); //Ok("cat");
  const result: Result<"cat"|"dog"> = petDecoder.decode("dog"); //Ok("dog");
  const result: Result<"cat"|"dog"> = petDecoder.decode("giraffe"); //Err("none of decoders matched");
  ```

- `allOfDecoders(...decoders: Decoder<T1|T2...Tn>[]): Decoder<Tn>` - takes a number decoders as parameter and tries to decode a value with each in sequence, all decoders have to succeed. If at leat one defocer fails - returns `Err`.

  ```TypeScript
  const catDecoder = exactDecoder("cat");
  const result: Result<"cat"> = allOfDecoders(stringSecoder, catDecoder); //Ok("cat")
  ```

## Type inference

Type works both ways - not only you can specify type for a decoder, it is also possible to infer the type from an existing decoder, particularly useful for composition of decoders:

```TypeScript
type Number = DecoderType<typeof numberDecoder>; //number
const someDecoder = objectDecoder({
  field1: stringDecoder,
  field2: numberDecoder,
  field3: arrayDecoder(numberDecoder)
});
type Some = DecoderType<typeof someDecoder>; // {field1: string, field2: number, field3: number[] }
const some: Some = await someDecoder.decodeAsync({...});
```

## API

Each decoder has the following methods:

- `decode(json:unknown): Result<T>` - attempts to decode a value of `unknown` type. Returns `Ok<T>` if succesful, `Err<T>` otherwise.
- `decodeAsync(json:unknown): Promise<T>` - Returns a `Promise<T>` that attempts to decode a value of `unknown` type. Resolves with `T` if succesful, rejects `Error{message:string}` otherwise.
  A typical usage of this would be in an `async` function context:

  ```TypeScript
  const getPet = async (): Promise<Pet> => {
    const result = await fetch("http://some.pet.api/cat/1");
    const pet: Pet = await petDecoder.decodeAsync(await result.json());
    return pet;
  };
  ```

- `map(func: (t: T) => T2): Decoder<T2>` - each decoder is a [functor](https://wiki.haskell.org/Functor). `Map` allows you to apply a function to an underlying decoder value, provided that decoding succeeded. Map accepts a function of type `(t: T) -> T2`, where `T` is a type of decoder (and underlying value), and `T2` is a type of resulting decoder.

- `then(bindFunc: (t: T) => Decoder<T2>): Decoder<T2>` - allows for [monadic](https://wiki.haskell.org/Monad) chaining of decoders. Takes a function, that returns a `Decoder<T2>`, and returns a `Decoder<T2>`

### Custom decoder

## Result and pattern matching

Decoding can either succeed or fail, to denote that `json-decoder` has [ADT](https://en.wikipedia.org/wiki/Algebraic_data_type) type `Result<T>`, which can take two forms:

- `Ok<T>` - carries a succesfull decoding result of type `T`, use `.value` to access value
- `Err<T>` - carries an unsuccesfull decoding result of type `T`, use `.message` to access error message

`Result` also has functorial `map` function that allows to apply a function to a value, provided that it exists

```TypeScript
const r: Result<string> = Ok("cat").map(s => s.toUpperCase()); //Ok("CAT")
const e: Result<string> = Err("some error").map(s => s.toUpperCase()); //Err("some error")
```

It is possible to pattern-match (using poor man's pattern matching provided by TypeScript) to determite the type of `Result`

```TypeScript
// assuming some result:Result<Person>

switch (result.type) {
  case OK: result.value; // Person
  case Err: result.message; // message string
}
```

## Friendly errors

TBC

## Mapping and type conversion

TBC

## Validation

`JSON` only exposes an handful of types: `string`, `number`, `null`, `boolean`, `array` and `object`. There's no way to enforce special kind of validation on any of above types using just `JSON`. `json-decoder` allows to validate values against a predicate.

#### Example: `integerDecoder` - only decodes an integer and fails on a float value

```TypeScript
const integerDecoder: Decoder<number> = numberDecoder.validate(n => Math.floor(n) === n, "not an integer");
const integer = integerDecoder.decode(123); //Ok(123)
const float = integerDecoder.decode(123.45); //Err("not an integer")

```

#### Example: `emailDecoder` - only decodes a string that matches email regex, fails otherwise

```TypeScript
const emailDecoder: Decoder<number> = stringDecoder.validate(/^\S+@\S+$/.test, "not an email");
const email = emailDecoder.decode("joe@example.com"); //Ok("joe@example.com")
const notEmail = emailDecoder.decode("joe"); //Err("not an email")

```

## Contributions are welcome

Please raise an issue or create a PR
