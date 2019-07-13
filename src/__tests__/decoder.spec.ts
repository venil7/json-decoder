import {
  stringDecoder,
  numberDecoder,
  boolDecoder,
  nullDecoder,
  oneOfDecoders,
  Result,
  ERR,
  objectDecoder,
  allOfDecoders,
} from "../decoder";

test("string decoder", async () => {
  const val = "some text";
  const result = await stringDecoder.decodeAsync(val);
  expect(result).toBe(val);
});

test("number decoder", async () => {
  const val = 123;
  const result = await numberDecoder.decodeAsync(val);
  expect(result).toBe(val);
});

test("bool decoder", async () => {
  const val = true;
  const result = await boolDecoder.decodeAsync(val);
  expect(result).toBe(val);
});

test("null decoder", async () => {
  const val: null = null;
  const result = await nullDecoder.decodeAsync(val);
  expect(result).toBe(val);
});

test("undefined decoder", async () => {
  const val: null = null;
  const result = await nullDecoder.decodeAsync(val);
  expect(result).toBe(val);
});

test("map decoder", async () => {
  const val = "12";
  const result = await stringDecoder.map(parseInt).decodeAsync(val);
  expect(result).toBe(12);
});

test("one of decoder", async () => {
  const val = "12";
  const result = await oneOfDecoders<number | string>(
    numberDecoder,
    stringDecoder
  ).decodeAsync(val);
  expect(result).toBe(val);
});

test("all of decoders", async () => {
  const val = "12.0";
  const result = await allOfDecoders(
    stringDecoder.map(parseFloat),
    numberDecoder.map((x) => x * 2)
  ).decodeAsync(val);
  expect(result).toBe(24.0);
});

// test("maybe decoder success", async () => {
//   const val = "text";
//   const maybeStringDecoder = maybeDecoder(stringDecoder);
//   const result: Maybe<string> = await maybeStringDecoder.decodeAsync(val);
//   expect(await result.valueAsync()).toBe(val);
// });

// test("maybe decoder failure", async () => {
//   const val = "text";
//   const maybeStringDecoder = maybeDecoder(numberDecoder);
//   const result: Result<Maybe<number>> = maybeStringDecoder.decode(val);
//   expect(result.type).toBe(ERR);
// });

test("type decoder failure", async () => {
  type Person = { name: string; age: number };
  const val: unknown = { name: "peter", age: 26 };
  const testDecoder = objectDecoder<Person>({
    name: stringDecoder,
    age: numberDecoder,
  });
  const result = await testDecoder.decodeAsync(val);
  expect(result).toStrictEqual(val as {});
});
