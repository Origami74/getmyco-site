# getmyco.app

The download site for [Myco](https://github.com/Origami74/myco) — your portal to the mesh.

Live at **https://getmyco.app**.

## Develop

```sh
npm install
npm run dev       # http://localhost:5173 (pass --port to change)
npm run build     # static site in dist/
npm run preview   # serve the build
```

## How it fits together

| File | What it does |
| --- | --- |
| `index.html` | The page: hero with the phone, then the scroll story |
| `src/intro.js` | The app intro inside the phone (GSAP). Everything in `.screen` ports to the Android app; the stage around it is site-only |
| `src/release.js` | Finds the latest Myco release on Zapstore with [applesauce](https://applesauce.build) |
| `src/main.js` | Wires the download buttons and the scroll reveals |
| `src/style.css` | Styles |
| `public/` | Images, favicon, `CNAME` |

### The download button

"Download Myco" resolves the newest release live from `wss://relay.zapstore.dev`:

1. kind `30063` releases tagged `i=app.myco`, newest version on the `main` channel
2. its `e` tag → the kind `3063` asset for `android-arm64-v8a`
3. the asset's `url` becomes the button's link

Only events signed by Myco's publisher key are trusted
(`PUBLISHER` in `src/release.js`); anyone can publish a release that claims
to be `app.myco`. If the relay can't be reached, the button falls back to
the [Zapstore page](https://zapstore.dev/apps/app.myco).

### Intro dev flags

- `?t=4.6` — freeze the intro at that second
- `?prompt` — jump to the settled mark with "tap to start" up
- `?eye=1.2` — freeze the pupil/dive at that second

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`). The custom domain comes from
`public/CNAME`.
