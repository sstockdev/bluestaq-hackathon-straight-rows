"""Every window, identifier, and threshold the detector uses.

Each threshold's comment names the dev episode or measurement it came from.
Detectors read these as config.NAME at call time, so scripts/sensitivity.py
can change one value and rerun.
"""

DEV_START, DEV_END = "2026-05-04T00:00:00+00:00", "2026-05-06T00:00:00+00:00"
EVAL_START, EVAL_END = "2026-05-06T00:00:00+00:00", "2026-05-07T00:00:00+00:00"
TRACTORS = ("T1", "T2", "T3")
MAX_DETECTIONS = 500               # limit in validate_submission.py

ACTION = {
    "SPACE_WEATHER": "HALT_OR_DEGRADED_MODE",
    "JAMMING": "HALT_AND_REPORT",
    "SPOOFING": "HALT_CROSSCHECK_AND_REPORT",
    "EQUIPMENT_FAULT": "SERVICE_MACHINE_OTHERS_CONTINUE",
    "MULTIPATH": "CONTINUE_FALSE_ALARM",
}

# Working mask and smoothing
WORKING_SPEED_MPS = 1.0            # speed is 4.5 while working and 0 while parked
SMOOTH_CN0_S = 31                  # centered median; it keeps a step where it is

# How much C/N0 loss the sky explains: sag = intercept + slope * S4, once S4 passes the minimum
S4_MAX_AGE_S = 1200                # S4 arrives every 900 s
S4_SAG_MIN = 0.31                  # 05-05: S4 0.27-0.30 gave no sag, 0.317 gave 7.8 dB
SAG_INTERCEPT_DB = 2.1             # fit to the 05-05 storm, residuals under 0.1 dB
SAG_SLOPE_DB = 18.0

# Space weather
SW_MIN_DROP_DB = 5.0               # the weakest dev storm sag is 7.8 dB
SW_MERGE_GAP_S = 120
SW_MIN_DURATION_S = 600

# Jamming
JAM_TRIGGER_DB = 6.0               # TRN-04: T3 excess 8.0 dB
JAM_MEMBER_DB = 4.5                # TRN-04: T1 at 5.5 dB is in the label, T2 at 2.8 dB is not
JAM_MERGE_GAP_S = 120
JAM_MIN_DURATION_S = 180
GRADED_SPREAD_DB = 3.0             # TRN-03 spread 5.3 dB, TRN-05 spread 0.2 dB
RFI_MAX_DELAY_S = 2700             # reports arrive 10-30 min late; dev delays were 10.7 and 14.8 min

# Spoofing
SPOOF_SMOOTH_S = 61
SPOOF_XTE_M = 1.0                  # healthy XTE median is 0.02 m
SPOOF_MAX_EXCESS_DB = 3.0          # a spoofed tractor keeps normal signal
SPOOF_MERGE_GAP_S = 120
SPOOF_MIN_DURATION_S = 300

# Equipment fault
FAULT_GAP_DB = 12.0                # a dropout second: cn0 - min_cn0 at or above this
FAULT_WINDOW_S = 600
FAULT_DROPOUT_FRAC = 0.12          # TRN-09 runs at 0.24; healthy 0.03; storm 0.06
FAULT_MERGE_GAP_S = 120
FAULT_MIN_DURATION_S = 600
LINK_MERGE_GAP_S = 300             # TRN-10: the link flaps in bursts of 1-16 s
LINK_MIN_DURATION_S = 300

# Multipath
MP_GAP_DB = 9.0                    # headland dip: min_cn0 40 -> 32 while cn0 holds
MP_BRIDGE_S = 5
MP_MIN_S, MP_MAX_S = 10, 40        # both dev labels last 17 s
MP_SPOT_DECIMALS = 3               # latitude bin of about 110 m
MP_MIN_RECUR = 10

# Confidence
CONF_BASE, CONF_MIN, CONF_MAX = 0.60, 0.05, 0.95
CONF_NO_S4_CAP = 0.40
CONF_SINGLE_MACHINE_LOSS_CAP = 0.45
