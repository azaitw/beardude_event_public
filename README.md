# Beardude Land (preact ver.)

## Development Workflow

**Start a live-reload development server:**

```sh
npm run dev
```

**Testing with `mocha`, `karma`, `chai`, `sinon` via `phantomjs`:**

```sh
npm test
```

**Generate a production build in `./build`:**

```sh
npm run build
```

**Start local production server with [serve](https://github.com/zeit/serve):**

```sh
npm start
```

---

```js
<Router>
  <A path="/" />
  <B path="/b" id="42" />
  <C path="/c/:id" />
</Router>
```


[Preact]: https://github.com/developit/preact
[preact-compat]: https://github.com/developit/preact-compat
