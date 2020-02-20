### Validation

```
let emailDecoder : Decoder<number> = stringDecoder.validate(/^\S+@\S+$/.test, "not an email");
let email = emailDecoder.decode("joe@example.com"); //Ok("joe@example.com")
let notEmail = emailDecoder.decode("joe"); //Err("not an email")
```
