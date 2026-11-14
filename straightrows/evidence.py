"""Confidence and evidence for a candidate, both built from the same measured facts.

confidence_terms() lists what was added to or subtracted from the base score and why.
evidence() writes four sentences an operator can check: the farm anomaly, the footprint
on the other machines, what each sky feed says, and the action with any caveat.
Neither function reads the telemetry again; they only read Candidate.facts.
"""
import statistics

from . import config

NO_RFI = "No RFI report; reports are often missing, so this carries no weight."
SHORT_OUTAGE_S = 60   # a link outage up to this long is described as a short burst
NO_S4 = "S4 unavailable for this stretch, so the sky's share of the loss is unknown and confidence is capped."


def _when(ts):
    return ts.strftime("%Y-%m-%d %H:%M:%SZ")


def _clock(ts):
    return ts.strftime("%H:%M:%SZ")


def _per_machine(values, unit=" dB"):
    return ", ".join(f"{tractor} {value}{unit}" for tractor, value in values.items())


def confidence_terms(c):
    """The (reason, weight) pairs that apply to this candidate."""
    facts, weights, terms = c.facts, config.CONF_TERMS[c.cls], []
    add = lambda name, reason: terms.append((reason, weights[name]))

    if c.cls == "SPACE_WEATHER":
        drop = statistics.median(facts["drop_db"].values())
        if abs(drop - facts["expected_sag_db"]) <= config.CONF_SAG_MATCH_DB:
            add("sag_matches", "the drop matches what S4 predicts")
        if facts["spread_db"] < config.CONF_UNIFORM_DB:
            add("uniform", "every machine lost the same amount")
        if facts["kp_max"] is not None and facts["kp_max"] >= 5:
            add("kp_storm", "Kp reached storm level")
        if facts["advisory_id"]:
            add("advisory", "a storm advisory is on file")

    elif c.cls == "JAMMING":
        in_storm = facts["expected_sag_db"] > 0
        graded = facts["spread_db"] >= config.GRADED_SPREAD_DB
        if graded:
            add("graded", "the loss differs by machine, as distance from a transmitter would")
        if facts["rfi"]:
            strong = facts["rfi"]["confidence"] >= config.CONF_STRONG_RFI
            add("rfi_report" if strong else "rfi_report_weak", "an interference report arrived near the farm")
        if not in_storm and facts.get("s4_available") is not False:
            add("quiet_sky", "the sky is quiet, so it explains none of the loss")
        if in_storm and not graded:
            add("uniform_in_storm", "equal loss during a storm could be scintillation beyond what S4 shows")

    elif c.cls == "SPOOFING":
        if abs(facts["excess_db"]) < config.CONF_HEALTHY_SIGNAL_DB:
            add("healthy_signal", "the signal is as strong as the sky predicts")
        if facts["onset_method"] == "extrapolated":
            add("steady_ramp", "the drift climbs at a steady rate")
        if facts["in_storm"]:
            add("in_storm", "a storm makes every machine's guidance noisy")

    elif c.cls == "EQUIPMENT_FAULT":
        if facts["kind"] == "link" and facts["neighbor_link_down_frac"] < config.CONF_NEIGHBOR_DROPOUT:
            add("link", "the correction link drops out on this machine only")
        if facts["kind"] == "antenna" and facts["neighbor_dropout_frac"] < config.CONF_NEIGHBOR_DROPOUT:
            add("antenna_one_machine", "the other machines do not show the dropouts")
        if facts.get("in_storm") or (facts["kind"] == "signal_loss" and facts["expected_sag_db"] > 0):
            add("in_storm", "a storm is in progress")

    elif c.cls == "MULTIPATH":
        if facts["recurrences"] >= config.MP_MIN_RECUR:
            add("recurs", "the dip repeats at the same place")
        if facts["in_storm"]:
            add("in_storm", "a storm makes the dip harder to separate from noise")
    return terms


def confidence(c):
    """Base score plus its terms, clamped, then capped where the evidence is thin."""
    score = config.CONF_BASE + sum(weight for _, weight in confidence_terms(c))
    score = min(max(score, config.CONF_MIN), config.CONF_MAX)
    if c.facts.get("s4_available") is False:
        score = min(score, config.CONF_NO_S4_CAP)
    if c.facts.get("kind") == "signal_loss":
        score = min(score, config.CONF_SINGLE_MACHINE_LOSS_CAP)
    return round(score, 2)


def _kp(facts, wording):
    """The Kp clause for the sky sentence, or nothing when the Kp feed is missing."""
    return "" if facts["kp_max"] is None else f" {wording} {facts['kp_max']} (global context only)."


def _sky_line(facts, reading):
    """The feeds sentence, or the fallback when S4 was missing."""
    return NO_S4 if facts.get("s4_available") is False else reading


def _space_weather(c):
    f = c.facts
    drop = statistics.median(f["drop_db"].values())
    advisory = f" Advisory {f['advisory_id']} reports geomagnetic storming." if f["advisory_id"] else ""
    footprint = ("so the loss is the same everywhere, as a regional cause would be." if f["spread_db"] < config.CONF_UNIFORM_DB
                 else "so the machines differ, and a regional cause alone does not explain the difference.")
    fit = ("which accounts for the drop." if abs(drop - f["expected_sag_db"]) <= config.CONF_SAG_MATCH_DB
           else f"against a drop of {drop:.1f} dB, so the sky does not account for all of it.")
    return [
        f"Every working machine ({', '.join(c.tractors)}) sat about {drop:.1f} dB below its normal mean C/N0 from {_when(c.start)} to {_clock(c.end)}.",
        f"Per machine: {_per_machine(f['drop_db'])}. The spread is {f['spread_db']} dB, {footprint}",
        _sky_line(f, f"S4 median {f['s4_median']} (max {f['s4_max']}) predicts {f['expected_sag_db']} dB of sag, {fit}{_kp(f, 'Kp reached')}{advisory}"),
        f"Halt or run in degraded mode until S4 falls below {config.S4_SAG_MIN}. Loss beyond what S4 predicts would be reported separately as interference.",
    ]


def _jamming(c):
    f = c.facts
    lead = c.tractors[0]
    others = {t: v for t, v in f["excess_db"].items() if t != lead}
    shape = "graded across machines" if f["spread_db"] >= config.GRADED_SPREAD_DB else "the same on every machine"
    rfi = f["rfi"]
    report = (f"{rfi['id']} arrived {rfi['delay_min']} min after onset, {rfi['distance_km']} km from the farm, at confidence {rfi['confidence']}; that supports jamming."
              if rfi else NO_RFI)
    in_storm = f["expected_sag_db"] > 0
    single = f.get("kind") == "signal_loss"
    if single:
        action = (f"Service {lead}; the other machines continue. A jammer close to {lead} alone is the alternative, and it also means stopping {lead}.")
    elif in_storm and f["spread_db"] < config.GRADED_SPREAD_DB:
        action = ("Halt the affected machines and report the interference. Equal loss during a storm could also be scintillation "
                  "stronger than S4 shows; that case halts the machines too.")
    else:
        action = "Halt the affected machines and report the interference to the regional monitor."
    fix = "its fix stayed RTK_FIXED" if f["worst_fix"][lead] == "RTK_FIXED" else f"its fix degraded to {f['worst_fix'][lead]}"
    neighbors = f"Loss the sky does not explain on the other machines: {_per_machine(others)}." if others else "No other machine was working."
    return [
        f"{lead} mean C/N0 fell {f['drop_db'][lead]} dB below normal at {_when(c.start)} and stayed down until {_clock(c.end)}; {fix}.",
        f"{neighbors} Machines at or above {config.JAM_MEMBER_DB} dB count as affected ({', '.join(c.tractors)}); the loss is {shape} (spread {f['spread_db']} dB).",
        _sky_line(f, f"S4 {f['s4_median']} predicts {f['expected_sag_db']} dB of sag, leaving {f['excess_db'][lead]} dB on {lead} with no sky cause. {report}{_kp(f, 'Kp')}"),
        action,
    ]


def _spoofing(c):
    f = c.facts
    tractor = c.tractors[0]
    rate = f" at about {f['xte_rate_m_per_min']} m per minute" if f["xte_rate_m_per_min"] else ""
    caveat = " A storm is in progress, so the start time is less certain." if f["in_storm"] else ""
    return [
        f"{tractor} cross-track error climbed{rate} from {_when(c.start)} and reached {f['xte_max_m']} m by {_clock(c.end)}.",
        f"The other working machines stayed near {f['others_xte_m']} m over the same stretch, so the drift is on {tractor} alone.",
        _sky_line(f, f"{tractor} mean C/N0 is within {abs(f['excess_db'])} dB of what S4 {f['s4_median']} predicts, and its fix was no worse than {f['worst_fix'][tractor]}. A jammer would add signal loss, and the sky would move every machine, so neither explains a drift on one machine."),
        f"Halt {tractor}, cross-check its position against an independent source, and report.{caveat}",
    ]


def _equipment_fault(c):
    f = c.facts
    tractor = c.tractors[0]
    if f["kind"] == "signal_loss":
        return _jamming(c)
    # The mean signal is only "held" when no storm is pulling it down.
    level = f"was {f['cn0_median']} dB-Hz during the storm" if f["in_storm"] else f"held at {f['cn0_median']} dB-Hz"
    if f["kind"] == "link":
        outage = f["longest_link_outage_s"]
        pattern = "in short bursts" if outage <= SHORT_OUTAGE_S else f"with one outage of {outage} s"
        shared = f["neighbor_link_down_frac"] >= config.CONF_NEIGHBOR_DROPOUT    # the other machines lost it too
        if f["neighbor_link_down_frac"] == 0:
            neighbors = "never lost their link."
        elif shared:
            neighbors = f"lost their link up to {f['neighbor_link_down_frac']:.0%} of the time, which points at the shared correction source."
        else:
            neighbors = f"lost their link at most {f['neighbor_link_down_frac']:.0%} of the time."
        sky = (f"S4 {f['s4_median']}: a storm is lowering the signal on every machine, but a storm does not take the correction link down."
               if f["in_storm"] else
               f"S4 {f['s4_median']}: the satellite signals are unaffected, so the fault is in the correction path and not in the sky.")
        action = (f"Check the base station and the shared correction feed before servicing {tractor}." if shared
                  else f"Service {tractor}'s correction radio or base link; the other machines continue.")
        return [
            f"{tractor} RTK correction link was down {f['link_down_frac']:.0%} of the time from {_when(c.start)} to {_clock(c.end)}, {pattern}; its fix left RTK_FIXED {f['float_frac']:.0%} of the time.",
            f"{tractor} mean C/N0 {level}, and the other machines {neighbors}",
            _sky_line(f, sky),
            action,
        ]
    sky = (f"S4 {f['s4_median']}: a storm is in progress and raises the dropout rate on every machine, so the comparison with the other machines carries the diagnosis."
           if f["in_storm"] else
           f"S4 {f['s4_median']}: no sky cause is needed, and a jammer would lower the mean signal on more than one machine.")
    return [
        f"{tractor}'s weakest satellite sat {config.FAULT_GAP_DB:.0f} dB or more below its mean C/N0 {f['dropout_frac']:.0%} of the time from {_when(c.start)} to {_clock(c.end)}; satellites in use dipped to {f['sats_min']}.",
        f"The other machines showed such dropouts at most {f['neighbor_dropout_frac']:.0%} of the time, and {tractor} mean C/N0 {level}.",
        _sky_line(f, sky),
        f"Service {tractor}'s antenna and cabling; the other machines continue.",
    ]


def _multipath(c):
    f = c.facts
    tractor = c.tractors[0]
    sky = (f"S4 {f['s4']}: a storm is in progress and deepens the dip, but the dip still sits at the recurring spot."
           if f["in_storm"] else f"S4 {f['s4']}: the sky is quiet, and a dip tied to one place does not come from the sky.")
    return [
        f"{tractor}'s weakest satellite dipped to {f['min_cn0_db']} dB-Hz for {f['duration_s']} s at {_when(c.start)} while its mean C/N0 held at {f['cn0_db']} dB-Hz.",
        f"{tractor} shows the same dip at latitude {f['spot_lat']} on {f['recurrences']} passes in the data, about once per pass.",
        _sky_line(f, sky),
        "Continue; this is a false alarm from a fixed reflector at the headland.",
    ]


_WRITERS = {
    "SPACE_WEATHER": _space_weather,
    "JAMMING": _jamming,
    "SPOOFING": _spoofing,
    "EQUIPMENT_FAULT": _equipment_fault,
    "MULTIPATH": _multipath,
}


def evidence(c):
    """Four sentences: the farm anomaly, the footprint, the sky feeds, the action."""
    return _WRITERS[c.cls](c)
