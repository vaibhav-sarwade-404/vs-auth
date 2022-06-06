# VS-Auth

## OAuth 2.0 and OIDC specification implementation with Node and Express JS

VS-auth is POC on OAuth 2.0 and OIDC specification for testing understanding for these specifications. For now VS-auth supports only [ Authorization code with PKCE](https://datatracker.ietf.org/doc/html/rfc6749#section-1.3.1) and [Refresh token flow](https://datatracker.ietf.org/doc/html/rfc6749#section-1.5)

## Features implemented

- `/authorize` endpoint with validations.
  - `audience` - with strict validations.
  - `response_type`
  - `redirect_uri` - strict validations.
  - `client_id` - strict validations.
  - `code_challenge_method` - supported `plain | S256`.
  - `code_challenge` - to verify in `token` call.
  - `state` - supported for round trip data, for consumer validatoin or persisting some information
- `/login` enpoint with session validations, state validation.
- `/logout` enpoint with validations.
- `/error` redirect if any of above validations failed.
- `Login page , Error page` HTML served from authorization / resource server. (Note: This project has signle server which works as authorization and resource server).
- Authorization code with PKCE, for `code_challenge` verification, supported `code_challenge_method` are `S256` and `plain`. If nothing sent no verification done before code exhcnage.
- `/token` call supported for `grant_type` as `authorization_code` and `refresh_token`, verified with race conditions (2 requests at same time).
- `/userinfo` endpoint is also supported.
- For `openid` scope `id_token` is issued.
- CSRF is implemented for POST requests `/login` and `/signup` with package `csurf`.
- Session management with `express-session` and `connect-mongodb-session`
- Important log events persisted with 30 days TTL.
- Custom Rate limit for API's (with MongoDB)
  - `/users/login` - 100 requests per IP.
  - `/users/login` - 10 failed login event per email per IP, then access to email from that IP is blocked
  - `/userinfo` - 10 requests per IP

## Features to implemented

- [ ] Management API's to manage end users.
- [ ] Management API's to manage end tenant users.
- [ ] Management API's to manage applications (callbacks, logout callbacks, grant types, client secret rotation)
- [ ] Management API's to manage API audience, token expiry.
- [ ] Management API's to deploy login / error page HTML.

## Tech

This project is implemented with below tech / packages:

- [node.js] - evented I/O for the backend
- [Express] - Fast, unopinionated, minimalist web framework for Node.js
- [Mongodb] - NoSQL Database
- [mongoose] - Mongoose is a MongoDB object modeling tool.
- [Csurf] - To prevent CSRF attacks
- [jsdom] - To inject data in login and error page while serving response.
- [jsonwebtoken]: Verify and sign tokens
- [Express-session]: For express sessions
- [Cookie-parser] - Cookie parser used for session cookies.
- [Connected-mongo-db-session]: For persisted sessions in Mongo DB
- [Bcrypt]: For password hashing and comparing hashed password.

## License

MIT

[//]: # "These are reference links used in project"
[node.js]: https://nodejs.org
[express]: https://expressjs.com/
[reactjs]: https://reactjs.org/
[mongodb]: https://www.mongodb.com/
[csurf]: https://github.com/expressjs/csurf
[jsdom]: https://github.com/jsdom/jsdom
[jsonwebtoken]: https://github.com/auth0/node-jsonwebtoken
[mongoose]: https://github.com/Automattic/mongoose
[express-session]: https://github.com/expressjs/session
[connected-mongo-db-session]: https://github.com/mongodb-js/connect-mongodb-session
[bcrypt]: https://github.com/kelektiv/node.bcrypt.js
[cookie-parser]: https://github.com/expressjs/cookie-parser
