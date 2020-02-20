1. inro

2. define a problem
   internal input is always unreliable,
   whether youre building a frontend app, and backend response API is
   frequently changing or unrealibale or youre building
   a backend, say for example RESTfull api, and its user input that again always unrealibale

3. how other languages tackle this problem, in a similar domain?

- trust the input, or employ a defensive style of programming,
  check for existence of every field, or the shape of data.

separation of concerns, domain objects maybe different from JSON

We have no guarantees about any of the information here.
The server can change the names of fields, and the fields may have different types
in different situations. It is a wild world!
Elm
