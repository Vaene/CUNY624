# USGS Wildfire Tree Regression Demo

This folder now hosts the presentation in a small Next.js app.
The slide deck itself is still the same browser-native presentation,
but Next serves it from `/presentation/index.html` so you can run it with
`npm run dev` or `npm run build`.

## Run the presentation

From `usgs_wildfire_demo/`:

```bash
npm install
npm run dev
```

Then open the app served by Next.js.

For production builds:

```bash
npm run build
npm run start
```

The deck source is synced into `public/presentation/` automatically before
`dev` and `build`.

## Notes

- The interactive slides use Pyodide + scikit-learn in the browser.
- The legacy R/Shiny assets are still present for reference, but they are no
  longer required to run the presentation.
- The older wildfire model artifacts remain in `artifacts/`.
