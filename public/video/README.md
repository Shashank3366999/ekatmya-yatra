# Video assets

## Committed

| File | Size | Used for |
| --- | --- | --- |
| `hero-loop.mp4` | 0.77 MB | The silent 18s loop behind the landing hero |
| `poster.jpg` | 103 KB | Poster frame for the hero and the Watch section |
| `alt.jpg` | 37 KB | A second still, spare |

## Not committed — supply separately

`ekatma-dham-journey-of-oneness.mp4` — the full Government of Madhya Pradesh
film, *Ekatma Dham — A Journey of Oneness* (1280×720, 7m48s, **86 MB**).

It is deliberately **git-ignored**: 86 MB would stay in the repository's history
permanently and make every clone expensive. Drop it into this folder to make the
landing page's "Watch" section work locally.

Better still for production: host it on YouTube/Vimeo or behind a CDN, or supply
a compressed version — see `docs/TEAM-QUESTIONS.md` Q7b.

## Regenerating the hero loop

The loop was cut from the full film with Chrome's MediaRecorder rather than
ffmpeg, because it needed re-encoding to H.264 mp4 and Chrome can do that
natively. If the source is replaced, regenerate at 960×540, ~850 kbps, 18s,
silent.

**Do not point the hero at the full film instead.** That was the first attempt,
looping only its opening — and it pulled **64 MB in the first eight seconds**,
because capping playback position does not stop the browser buffering ahead.
`pnpm test:mobile` now asserts the hero uses `hero-loop.mp4`.
