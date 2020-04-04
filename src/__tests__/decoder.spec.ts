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
  anyDecoder,
  Err,
  OK,
  Ok,
  valueDecoder
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
  const result = await oneOfDecoders<string | number>(
    numberDecoder,
    stringDecoder
  ).decodeAsync(val);
  expect(result).toBe(val);
});

test("all of decoders", async () => {
  const val = "12.0";
  const result = await allOfDecoders(
    stringDecoder.map(parseFloat),
    numberDecoder.map(x => x * 2)
  ).decodeAsync(val);
  expect(result).toBe(24.0);
});

test("failing map returns Err", async () => {
  const val = "cat";
  const decoder = stringDecoder.map(x => {
    throw new Error("mapping fault");
    return "hello"; // this is ti satisfy type inference
  });
  const result = decoder.decode(val);
  expect(result.type).toBe(ERR);
  expect((result as Err<string>).message).toBe("mapping fault");
});

test("failing validation returns Err", async () => {
  const val = "dog";
  const validate = (s: string) => s === "cat";
  const decoder = stringDecoder.validate(validate, "not a cat");
  const result = decoder.decode(val);
  expect(result.type).toBe(ERR);
  expect((result as Err<string>).message).toBe("not a cat");
});

test("succesfull validation returns Ok", async () => {
  const val = 123;
  const isInteger = (n: number) => Math.floor(n) === n;
  const decoder = numberDecoder.validate(isInteger, "not an interegr");
  const result = await decoder.decodeAsync(val);
  expect(result).toBe(val);
});

test("object decoder (success)", async () => {
  type Person = { name: string; age: number };
  const val: unknown = { name: "peter", age: 26 };
  const testDecoder = objectDecoder<Person>({
    name: stringDecoder,
    age: numberDecoder
  });
  const result = await testDecoder.decodeAsync(val);
  expect(result).toStrictEqual(val as Person);
});

test("object decoder (null)", async () => {
  const testDecoder = objectDecoder({
    name: stringDecoder,
    age: numberDecoder
  });
  const result = testDecoder.decode(null);
  expect((result as Err<null>).message).toEqual("expected object, got null");
  expect(result.type).toEqual(ERR);
});

test("any decoder", async () => {
  const val: unknown = { name: "peter", age: 26 };
  const result = await anyDecoder.decodeAsync(val);
  expect(result).toStrictEqual(val);
});

test("mapping Ok result", async () => {
  const val: string = "cat";
  const result_: Result<string> = stringDecoder.decode(val);
  const result = result_.map(x => x.toUpperCase());
  expect(result.type).toBe(OK);
  expect((result as Ok<string>).value).toBe("CAT");
});

test("mapping Err result", async () => {
  const val = 123;
  const result_ = stringDecoder.decode(val);
  const result = result_.map(x => x.toUpperCase());
  expect(result.type).toBe(ERR);
  expect((result as Err<string>).message).toBe("expected string, got number");
});

test("value decoder", async () => {
  const val: unknown = { name: "mickey mouse", age: 26 };
  const value = "donalnd duck";
  const result = await valueDecoder(value).decodeAsync(val);
  expect(result).toStrictEqual(value);
});
