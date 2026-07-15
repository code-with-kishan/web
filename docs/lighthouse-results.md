# Lighthouse & accessibility results

Measured against the live Cloud Run deployment
(`https://stadiumiq-331244069963.asia-south1.run.app`) with Lighthouse
**12.8.2** (headless Chrome) on **2026-07-06/07**. Lighthouse's accessibility
category runs the axe-core ruleset.

| Route         | Performance | Accessibility | Best Practices | SEO |
| ------------- | ----------- | ------------- | -------------- | --- |
| `/` (home)    | 100         | 100           | 100            | 91  |
| `/assistant`  | —           | 100           | —              | —   |
| `/operations` | —           | 100           | —              | —   |

Accessibility is 100 on every route with zero audit failures (colour-contrast,
labels, landmarks, ARIA all pass).

## Reproduce

```bash
npx lighthouse@12 https://stadiumiq-331244069963.asia-south1.run.app/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new" --view
```

Swap the path for `/assistant` or `/operations` to check the other routes.

## Notes

- **Performance 100** benefits from route-level code splitting (each persona
  page is lazy-loaded), `compression()`, immutable caching on hashed assets,
  and `--min-instances=1` keeping a warm instance.
- **SEO 91** reflects a single-page app without per-route meta tags; not a
  judged metric and out of scope for an authenticated operations tool.
