# Straight Rows

A detector that says why a tractor's GPS guidance drifted, and what the operator should do about it. I built it for the Bluestaq and NDSU Straight Rows hackathon.

It reads one-second telemetry from three tractors, along with the sky feeds (S4, Kp, interference reports and advisories), and reports each episode of degraded guidance on the evaluation day: when it started and ended, which tractors it hit, the cause, and the action. The cause is space weather, jamming, spoofing, an equipment fault or multipath, and causes can overlap. Every report carries a confidence and four sentences of evidence you can check against the data.

It uses rules and no trained model.

On those 12 episodes it scores 40.00 out of 40, against 20.15 for the starter baseline. [Where it breaks](#where-it-breaks) covers what the score doesn't show.

## Quick start

You need Python 3.11-3.14.

```bash
python3.14 -m venv .venv
source .venv/bin/activate            # Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python scripts/get_data.py           # downloads the dataset into data/ and checks its checksum
python make_submission.py            # scores dev, then writes and validates submission.json
```

The dataset isn't in the repository. If you already have `StraightRows_Student_Package.zip`, run `python scripts/get_data.py --zip PATH`.

The three dependencies are pinned in `requirements.txt` (numpy 2.3.3, pandas 2.3.3, matplotlib 3.10.6).

Other commands:

```bash
python scripts/score_dev.py                       # dev score for this detector
python scripts/score_dev.py --detector baseline   # dev score for the starter baseline
python scripts/sensitivity.py                     # move each threshold by 25% and rerun dev
python scripts/plot_episode.py --start 2026-05-04T16:15:00Z --end 2026-05-04T17:30:00Z --out figures/example.png
python app/tools/export_data.py                   # export the results for the map app (see app/README.md)
```

## How it works

One table with a row for every second feeds five detectors, one per cause. The detectors don't know about each other, so a storm and a jammer inside it come out as two overlapping detections. Seconds when a tractor is parked are ignored everywhere.

Three numbers do most of the work:

- Drop: how many dB a tractor's signal (mean C/N0) is below its own normal level, which is its median over the file.
- Sag: the part of the drop the sky explains. On the dev storm it is `2.1 + 18 × S4` dB once S4 reaches 0.31, and zero below that.
- Unexplained loss: drop minus sag.

![A storm with jamming and spoofing inside it](figures/dev_storm_with_jamming_and_spoofing.png)

In the figure, the dashed line is what S4 predicts. From 19:00 to 22:00 the tractors follow it, which is space weather. From 20:00 to 20:36 they fall 12 dB below it with S4 unchanged, which is jamming. From 21:30 one tractor drifts off its line while its signal stays on the dashed line, which is spoofing.

Each detector flags seconds, joins them into events, and then checks each event:

| Cause | A second is flagged when | The event is kept when | Action |
|---|---|---|---|
| Space weather | Every working tractor is 5 dB or more below normal | S4 over the event is 0.31 or more | Halt or run degraded |
| Jamming | Some working tractor has 6 dB or more of unexplained loss | Two or more tractors have a median of 4.5 dB or more | Halt and report |
| Spoofing | One tractor's smoothed drift is 1 m or more past the other working tractors, with under 3 dB of unexplained loss | Always. The start is walked back by the time the drift took to double | Halt, cross-check and report |
| Equipment fault | On one tractor, the weakest satellite keeps dropping 12 dB or more below the mean (antenna), or the RTK correction link drops in repeated short bursts (link) | Always | Service that machine, the others continue |
| Multipath | The weakest satellite dips for 10 to 40 seconds | The dip is at the latitude where that tractor's dips keep recurring. Every pass is reported | Continue, false alarm |

Confidence starts at 0.60. Evidence for the cause adds to it, a rival explanation subtracts, and the result stays between 0.05 and 0.95. The weights are my judgment. The four evidence sentences (the farm anomaly, the other machines, the sky feeds, the action) are written from the same measured numbers as the confidence.

The thresholds and weights are in `straightrows/config.py`, each with a comment naming the dev episode it came from. Three numbers sit outside it: the Kp storm level of 5 in `straightrows/evidence.py`, and two "more than half" tests in `straightrows/detectors.py`.

## How I used the labels

The two dev days hold 12 labeled episodes. I plotted each one, wrote down which measurements moved and by how much, and set each threshold in a gap those measurements leave open. In the weakest jamming episode, for example, one tractor lost 5.5 dB and is in the label, and another lost 2.8 dB and isn't, so the cut for "affected" sits at 4.5 dB.

The labels also showed three things that shaped the rules:

- An episode starts when the tractors start working, even if the signal was already degraded.
- Causes overlap, including two on the same tractor.
- Jamming inside a storm looks the same on every tractor, so equal loss can't be the test for space weather.

No threshold was tuned against the evaluation window.

## Results

On the dev episodes:

| | Diagnostic | Episodes caught | False positives | Mean onset credit |
|---|---|---|---|---|
| Starter baseline | 20.15 / 40 | 7 of 12 | 5 | 0.497 |
| This detector | 40.00 / 40 | 12 of 12 | 0 | 1.000 |

On the evaluation day, May 6, there are no labels. The detector reports seven episodes and 486 multipath passes, which is 493 detections against the validator's limit of 500.

| Time (UTC) | Cause | Tractors | Confidence |
|---|---|---|---|
| 00:59 to 02:00 | Equipment fault, antenna | T1 | 0.80 |
| 02:12 to 02:54 | Jamming, with interference report RFI-003 | T1, T2, T3 | 0.95 |
| 13:00 to 16:00 | Space weather | T1, T2, T3 | 0.95 |
| 16:30 to 17:12 | Spoofing | T1 | 0.85 |
| 18:30 to 19:00 | Jamming, no report | T1, T2, T3 | 0.80 |
| 19:48 to 20:29 | Equipment fault, correction link | T2 | 0.85 |
| 21:48 to 22:24 | Spoofing | T3 | 0.85 |

I froze the thresholds at commit `e88d268` before I looked at this output, and ran the evaluation once. The detector does read May 6 telemetry in two places: each tractor's normal signal level is its median over all three days, and the multipath spot is the latitude where its dips recur over all three days. Neither uses a label.

The sag model was fitted on May 5 and never saw the May 6 storm.

## Where it breaks

The sensitivity sweep moves each of ten thresholds to 0.75 and 1.25 of its value. Seventeen of the twenty moves change nothing on dev. The three that break something show where it's fragile:

- Raising the jamming trigger from 6 to 7.5 dB splits the weakest jamming episode into pieces and adds three false positives.
- Raising the "affected" cut from 4.5 to 5.6 dB drops one tractor from that same episode, and it is missed.
- Lowering the antenna dropout gap from 12 to 9 dB counts storm and jamming noise as dropouts and reports ten false faults.

`python scripts/sensitivity.py` prints the full table.

What can go wrong in use:

- A jammer weaker than the weakest one in dev (under 6 dB on its hardest-hit tractor) isn't detected.
- The sag model comes from one storm day. If S4 relates to signal loss differently on another day, a storm can be reported as jamming, or a jammer hidden inside a storm.
- If S4 arrived one sample late, the first 15 minutes of a storm would look unexplained. When S4 is missing altogether, the detection is still reported, with confidence capped at 0.40 and the evidence saying so.
- One machine losing signal alone is reported as an equipment fault at confidence 0.45 or less. A jammer that reaches only one tractor would be reported the same way.
- The spoofing start time assumes a steady drift. A spoofer that jumps the position would get a late start.
- Multipath is located by reported latitude, which is displaced during spoofing.

## Decisions

| # | I chose | Instead of | Evidence from dev | Limit |
|---|---|---|---|---|
| 1 | One detector per cause, overlaps kept | One cause per moment | 3 of 12 episodes overlap another | One event can read two ways |
| 2 | Working seconds only, timed by telemetry | Timing from the sky feeds, or counting parked tractors | The baseline starts one storm 75 minutes early | A brief stop mid-field would split an episode |
| 3 | Sag = 2.1 + 18 × S4 once S4 reaches 0.31 | Kp as the storm test | Fits the May 5 storm within 0.1 dB | One storm day in one simulator |
| 4 | Jamming is 6 dB or more beyond the sag | Unequal loss across tractors as the test | Finds 12 dB of jamming inside a storm | A jammer weaker than the weakest in dev is missed |
| 5 | Kp is context: it adds 0.05 at most | Kp as a gate | Kp causes 2 of the baseline's 5 false positives | Gives up Kp's early warning |
| 6 | A report adds 0.15, a missing one nothing | Requiring a report | Reports arrive 10 to 30 minutes late, or never | Reports carry no direction |
| 7 | Spoofing is drift past the other tractors with a healthy signal | A fixed drift limit | Starts within 3 s, 1 s and 170 s of the labels | A spoofer that jumps gets a late start |
| 8 | Faults show in dropout rate and link bursts | Mean signal strength | 24% dropouts against 3% on the other tractors | A 9 dB gap reports ten false faults |
| 9 | Every multipath pass at the recurring spot | One dip, or dips anywhere | About 324 dips per tractor at one latitude | 486 reports, near the limit of 500 |
| 10 | Confidence is 0.60 plus fixed weights | One value for everything, or a fitted model | Dev runs from 0.50 to 0.95 | The weights are judgment |
| 11 | One machine alone is a fault, capped at 0.45 | Calling it jamming, or reporting nothing | Dev has no such case | Untested on labeled data |
| 12 | Thresholds frozen on dev, evaluation run once | Tuning after seeing the evaluation output | 17 of 20 threshold moves change nothing | A dev score says nothing about evaluation |

[docs/DECISIONS.md](docs/DECISIONS.md) has the full reasoning for each.

## Data that would help

An IMU or wheel odometry on each tractor: a position source that isn't GPS. Cross-track error in this dataset comes from an idealized monitor that knows the true line. A real receiver can't see its own spoofed drift.

## Docs

| Doc | For |
|---|---|
| [docs/DECISIONS.md](docs/DECISIONS.md) | The twelve design decisions in full |
| [app/README.md](app/README.md) | The map app that shows the detections |
| [docs/starter_README.md](docs/starter_README.md) | The organizers' starter README, unchanged |
| [docs/Bluestaq_NDSU_Straight_Rows_Hackathon_Official.pdf](docs/Bluestaq_NDSU_Straight_Rows_Hackathon_Official.pdf) | The official guide |

## Repository layout

```
straightrows/        The detector: config.py (thresholds), data.py, features.py, intervals.py, detectors.py, evidence.py, pipeline.py
make_submission.py   The one command: scores dev, writes dev_pred.json and submission.json, validates
decisions.json       The twelve decisions. scripts/render_decisions.py --write turns them into docs/DECISIONS.md
scripts/             Data download, dev scoring, the organizers' scorer, the sensitivity sweep, plotting
figures/             Figures used in this README
app/                 A map app for the tractors, the detections and the decisions. The detector doesn't depend on it
submission/          The starter baseline, validator and template, unchanged
notebooks/, docs/    The starter notebook, the starter README and the official guide, unchanged
```
