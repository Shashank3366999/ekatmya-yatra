# Video assets

## Committed

| File | Size | Used for |
| --- | --- | --- |
| `intro.mp4` | 5.3 MB | The opening 2 minutes, 960×540 — laptops and tablets |
| `intro-sm.mp4` | 3.2 MB | The same 2 minutes at 640×360 — phones |
| `intro-poster.jpg` | 42 KB | Poster frame, so first paint is an image |

Both renditions are the **first 120 seconds** of the film and nothing more, and
both are faststart (`moov` before `mdat`) so playback begins on the first chunk.
The landing hero picks between them with `<source media="(min-width: 700px)">`,
which is the only thing keeping a phone off the 5.3 MB file.

## Not committed — supply separately

`ekatma-dham-journey-of-oneness.mp4` — the full Government of Madhya Pradesh
film, *Ekatma Dham — A Journey of Oneness* (1280×720, 7m48s, **86 MB**).

It is deliberately **git-ignored**: 86 MB would stay in the repository's history
permanently and make every clone expensive. It is no longer shown anywhere on
the site either — it is kept only as the master to cut the intro from.

If the full film should be watchable in future, host it on YouTube/Vimeo or
behind a CDN rather than serving it from here — see `docs/TEAM-QUESTIONS.md`
Q7b.

## Regenerating the intro

With the master film in this folder:

```sh
ffmpeg -ss 0 -t 120 -i ekatma-dham-journey-of-oneness.mp4 \
  -vf "scale=960:-2,fps=24" -c:v libx264 -profile:v high -preset veryslow \
  -crf 32 -pix_fmt yuv420p -g 48 -c:a aac -b:a 48k -ac 1 \
  -movflags +faststart intro.mp4

ffmpeg -ss 0 -t 120 -i ekatma-dham-journey-of-oneness.mp4 \
  -vf "scale=640:-2,fps=24" -c:v libx264 -profile:v main -preset veryslow \
  -crf 32 -pix_fmt yuv420p -g 48 -c:a aac -b:a 48k -ac 1 \
  -movflags +faststart intro-sm.mp4

ffmpeg -ss 3 -i ekatma-dham-journey-of-oneness.mp4 -frames:v 1 \
  -vf "scale=1280:-2" -q:v 4 intro-poster.jpg
```

**Do not point the hero at the full film instead.** That was the first attempt,
looping only its opening — and it pulled **64 MB in the first eight seconds**,
because capping playback position does not stop the browser buffering ahead.
`pnpm test:mobile` asserts the hero loads `intro-sm.mp4` at phone width.
