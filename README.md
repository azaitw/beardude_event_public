# Beardude Land (preact ver.)
---

## Development Workflow


**4. Start a live-reload development server:**

```sh
npm run dev
```

**5. Testing with `mocha`, `karma`, `chai`, `sinon` via `phantomjs`:**

```sh
npm test
```

**6. Generate a production build in `./build`:**

```sh
npm run build
```

**5. Start local production server with [serve](https://github.com/zeit/serve):**

```sh
npm start
```

---


## Handling URLS

:information_desk_person: This project contains a basic two-page app with [URL routing](http://git.io/preact-router).

Pages are just regular components that get mounted when you navigate to a certain URL. Any URL parameters get passed to the component as `props`.

Defining what component(s) to load for a given URL is easy and declarative. You can even mix-and-match URL parameters and normal props.

```js
<Router>
  <A path="/" />
  <B path="/b" id="42" />
  <C path="/c/:id" />
</Router>
```


[Preact]: https://github.com/developit/preact
[preact-compat]: https://github.com/developit/preact-compat
