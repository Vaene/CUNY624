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
```

The deck source is synced into `public/presentation/` automatically before
`dev` and `build`.

## Deploy at `/624/Trees`

This app is configured as a static export so it can be hosted from S3 or any
other static host. Set `NEXT_PUBLIC_BASE_PATH` before the build so asset URLs
and routes resolve correctly under a subpath.

For `https://cuny.drinkthesand.com/624/Trees`, build with:

```bash
NEXT_PUBLIC_BASE_PATH=/624/Trees npm run build
```

That writes the static site to `out/`.

To upload that export to S3 under the same path:

```bash
S3_BUCKET=cuny.drinkthesand.com \
NEXT_PUBLIC_BASE_PATH=/624/Trees \
npm run deploy:s3
```

The deploy also uploads a source archive named `usgs_wildfire_demo.zip` to the
same S3 prefix and excludes `.DS_Store` files from the static sync.

If your bucket uses a different key prefix, override it explicitly:

```bash
S3_BUCKET=cuny.drinkthesand.com \
S3_PREFIX=624/Trees \
NEXT_PUBLIC_BASE_PATH=/624/Trees \
npm run deploy:s3
```

If the site is behind CloudFront, you can also invalidate after upload:

```bash
S3_BUCKET=cuny.drinkthesand.com \
S3_PREFIX=624/Trees \
NEXT_PUBLIC_BASE_PATH=/624/Trees \
CLOUDFRONT_DISTRIBUTION_ID=E123EXAMPLE \
npm run deploy:s3
```

## Notes

- In the interactive explorers, the orange path on the tree graphic is the
  active decision path for the current example. The tree shows many possible
  routes, but the orange one is the route actually chosen by the model for that
  case.
- If the orange path moves, either the selected example changed or the model
  changed because a slider changed the fitted tree or stage being shown.
- In the Boosting Explorer, the tree view is one representative boosting stage,
  not the whole ensemble by itself. The metrics summarize the full boosted
  model on the test set.
- Boosting Explorer metrics:
  `RMSE` punishes large errors more heavily, `R²` shows how much variance is
  explained, `MAE` shows average absolute error, `Train RMSE` shows fit on the
  training set, `Test RMSE` shows generalization on held-out data, and `Gap`
  is `Test RMSE - Train RMSE`, which helps flag overfitting when it grows.
- Boosting Explorer sliders:
  `N.trees` adds more sequential correction stages, `Shrinkage` changes how
  large each stage’s correction is, `Interaction depth` controls how complex
  each boosting tree can be, and `Bag fraction` controls what share of the
  training rows each stage sees.
- The interactive slides use Pyodide + scikit-learn in the browser.
- The legacy R/Shiny assets are still present for reference, but they are no
  longer required to run the presentation.
- The older wildfire model artifacts remain in `artifacts/`.
