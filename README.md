# Hacker Squad — Warehouse Championship

A voxel crowd-brawler that runs in the browser. Pick one of seven fighters — the Hacker Squad and three guests from
Sheep Village — walk into a warehouse turned tournament
arena, knock out **1000 hackers** and the **four top hackers** who come out to stop you, and take the title.

One stage, no story mode, four difficulty levels. Plain ES modules on three.js, a deterministic fixed 60 Hz simulation,
no build step.

## Run

Needs a WebGL2 browser. On a phone, hold it in landscape: touch controls appear on their own.

URL switches: `?go=story&char=ana` (or `go=free`) skips the menus straight into a battle; `?enemies=200` sets the crowd
size; `?hq` forces the full quality tier on a touch device.

## The fighters

| | Weapons | Plays like | Overclock |
| --- | --- | --- | --- |
| **Adam** — a boy in a black T-shirt and jeans | Microphone (on its stand) and a drone | Long reach, wide sweeps; screams and drone strafes hit at range | **Sonic Boom** — three screams, a drone strafe, the mic drop |
| **Ana** — a girl in a white sailor-style dress | Cellphone (on a selfie stick) and a laptop | The fastest hands: short-gap strings, dash cancels, spinning moves | **Viral Storm** — six dash cuts, a spinning storm, the burst |
| **Brian** — a man in a cap and a blue T-shirt | A cart and a camera | Slow and heavy; the cart flattens a rank, the camera's flash staggers a lane | **Rush Hour** — three flashes, a cart ride through the crowd, the unload |
| **Alex** — a sheep in flight goggles (from Sheep Village) | Umbrella | Long sweeps; opened, the umbrella throws a wide gale, calls a cloudburst down 5 m away, and carries him 4 m as a twister | **Typhoon** — he rides the spinning umbrella as the eye of a storm: **fly him with the stick**, then the storm drop |
| **Bryan** — a pig in a yellow safety helmet (from Sheep Village) | STOP-sign shield, traffic cones, roadworks fences | Slow and heavy; bats a cone 9 m down the lane, pops one up underfoot, shoves a fence through the ranks, kicks cones out in a fan, jackhammers the floor, scatters a ring of cones | **Road Closed** — four fence walls pen the crowd in, thirteen cones rain into the pen, then the slam |
| **Clara** — a cat in a witch costume (from Sheep Village) | Burning broom, pumpkins, bats | Quick strings that trail fire; breathes flame, lobs pumpkins, swarms the ring with bats | **Witching Hour** — the bat swarm, three pumpkin bombs, the Great Pumpkin |
| **Connector** — an oval jelly monster: three hairs, big eyes, a large mouth, orange balls for hands | Itself | Hops, spins, belly bumps; **copies** Adam's scream and Brian's flash; **Clone Call** (charge after the 5th hit) splits off three clones — blue, pink, yellow — that fight on their own for five seconds | **Giga Connect** — blows itself up to 100× its size: three giant hops **you steer one by one** (hold a direction before each take-off; a disc marks the landing), a giant spin, the belly flop. **Pressed in the air: Clone Call** — the three clones fight beside it for ten seconds |

## The stage

| Round | Hall | Goal | Boss |
| --- | --- | --- | --- |
| 1 | Loading Dock | 200 knock-outs | **PHISH** — lure casts, then a spam flood |
| 2 | Server Aisles | 450 knock-outs | **TROJAN** — shield charges, shock waves, calls his squads |
| Semi-final | Mainframe Core | 700 knock-outs | **RANSOM** — payload drops, a lockdown, carpet drops |
| Final | Mainframe Core | 1000 knock-outs | **ROOT**, the champion — four phases: blade rushes, three forks of himself, a blackout, the mask comes off |

Every boss area attack is telegraphed by a red disc filling up on the floor: walk out of it, roll through it, or jump
the travelling shock rings. Clearing a round heals you. Your squad (the white hoodies) fights alongside you.

**Practice** is the endless arena in the Mainframe Core: waves keep coming and you can't be knocked out.

## Difficulty

| Level | What changes |
| --- | --- |
| Easy | Half damage, long wind-ups, one attacker at a time, weaker bosses, bigger heals |
| Normal | The baseline |
| Hard | Tougher hackers and bosses, ×1.5 damage, shorter wind-ups, smaller heals |
| Extremely Hard | ×1.9 damage, three attackers at once, bosses shrug off light hits |

## Controls

| Action | Keys | Gamepad | Touch |
| --- | --- | --- | --- |
| Move (camera-relative) | WASD / arrow keys | left stick | floating stick (left half) |
| Attack | J / left click | X □ | ATK |
| Charge (mid-combo: a finisher) | K / right click | Y △ | CHG |
| Jump | Space | A × | JMP |
| Dodge | L / Shift | R1 R2 | DDG |
| Overclock (a gauge segment full) | I | B ○ | OC (lit when ready) |
| Steer a steerable Overclock (Connector's hops, Alex's flight) | WASD / arrow keys | left stick | floating stick |
| Camera | mouse (click the field to lock it) / Q E | right stick | drag on the right half |
| Recenter / face the nearest boss | R | L1 L2 | — |
| Pause | Esc | Start | II |

Tap attack for the string (up to six hits); press charge after the 1st–5th hit for a different finisher each time, or
on its own for the fighter's signature move. Run for a moment and attack for a dash attack; attack or charge in the air
for air moves.

## Project layout

```
index.html            page, styles, screens
serve.mjs             local static server
src/main.js           boot, flow (title → select → loading → battle → result), the fixed-step loop
src/core/             input, events, RNG, voxel mesher helpers, difficulty
src/hero/             the hero: rig + IK, combo system, locomotion
src/chars/<id>/       a fighter: char.js (texts, portrait) · kit.js · moves.js · anims.js · model.js · musou.js (Overclock) · view.js (effects)
src/chars/shared/     clothes, body assembly, the squat animal rig (squat.js), hair chains, locomotion carry, pooled effects
src/chars/officers/   enemy skins, lieutenant / boss models, boss behaviours
src/crowd/ src/combat/   the crowd (hundreds of fighters, squads, reinforcement waves) and hit resolution
src/story/            the stage script (championship.js), the director, the result screen
src/world/            the map engine (walk field, gates) and the warehouse (map.js + world.js)
src/ui/               title, select, loading, HUD, touch pad, menu helpers
src/camera/ src/post/ src/vfx/ src/audio/   camera, post-processing, combat effects, synthesised sound
bench/                headless bot: plays the whole stage in Node (no browser)
```

Adding a fighter = a folder in `src/chars/` plus one line in `src/chars/index.js`. Adding a stage = a data module in
`src/story/` plus one entry in `src/story/chapters.js` (and a map in `src/world/maps/` if it needs a new one).

## Test

```sh
node --import ./bench/register.mjs bench/run.mjs --char adam --diff normal
```

plays the championship start to finish with an autoplay bot in the Node sim and prints the timeline and the result
(`--char adam|ana|brian|alex|bryan|clara|connector`, `--diff easy|normal|hard|extreme`, `--style steady|careless`, `--quiet`). Node ≥ 22.

## Credits & license

This project is under the license of MIT, see [LICENSE](LICENSE); built on the references of hack.gguf.org, sheepvillage, voxel-musou, sheep-village and freedom-voxel reskins; the Hacker Squad content is added on top under the same license. three.js r186 — MIT. All characters are original and fictional.
