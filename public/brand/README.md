# Brand assets

## `oneness.avif` — in use

The Statue of Oneness at Omkareshwar. **1366×768, landscape**, with the figure
right of centre and open sky to its left.

That composition drives the layouts: copy goes over the sky with a dark scrim,
and `ShankaraPortrait` pins `object-position: 59% 28%` so the figure stays in
frame at any crop. Containers are capped near 1366px wide so the image renders
at roughly 1:1 and stays sharp.

> The file is AVIF. It arrived named `.png`, which would have made Next serve it
> as `image/png` — wrong `Content-Type`, and fragile. Keep the extension
> matching the actual format.

### If a larger original exists, send it

1366px is sharp everywhere it is used today. A **~2400px-wide** version would
allow a true full-bleed hero on large monitors without upscaling. Nothing needs
to change in the code — same filename, same aspect ratio.

## `login-bg.webp` — in use

The sign-in background. **1080×1889, portrait**, the figure left of centre with
the Himalayas and sky behind.

Portrait is why sign-in gets its own route group: on a phone the image's height
fills the screen exactly (cover crops the width, not the height), so the layout
can be composed against it rather than around a crop. On a laptop it is anchored
`object-[34%_8%]` so the head and sky stay in frame instead of the torso.

The file arrived as `login background.webp`. It was renamed — a space in an
asset path has to be URL-encoded everywhere it is referenced, and one missed
encoding is a silent 404.

## Still useful to have

| Asset | Used for |
| --- | --- |
| Ekatma Dham logo (SVG preferred) | Co-branding in headers and the footer |
| A second statue angle, or a Yatra crowd photo | Variety on the events and route screens |
| Official palette / typeface, if one exists | To replace our pumpkin + ink + green scheme |

## Note

We have deliberately not drawn or generated a likeness of Adi Shankaracharya.
Only official photography is used.
