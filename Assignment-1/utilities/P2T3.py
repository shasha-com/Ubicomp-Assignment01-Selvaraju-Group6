
# Assignment 1 - Part 2, Task 3
# Based on the teachers' utilities/host-ble-adv-receiver.py.
# The Puck.js sends X, Y, Z; this computer runs the trained neural network.

import asyncio
import sys
import struct
import time
import json
from pathlib import Path

import numpy as np
from bleak import BleakScanner

# Keep the Windows setup from the teachers' example.
if sys.platform == "win32":
    try:
        import ctypes
        ctypes.windll.ole32.CoUninitialize()
    except Exception:
        pass

ESPRUINO_MANUFACTURER_ID = 1424  # Same as 0x0590 in the Puck.js code.

# Find your existing model_for_puck.json.
# Both the original utilities folder and delivery-part-2/code are supported.
HERE = Path(__file__).resolve().parent
MODEL_PATHS = [
    HERE / "model_for_puck.json",
    HERE.parent.parent / "utilities" / "model_for_puck.json",
]
MODEL_PATH = next((p for p in MODEL_PATHS if p.is_file()), None)
if MODEL_PATH is None:
    raise FileNotFoundError(
        "Cannot find model_for_puck.json. Keep it in utilities, "
        "as in your GitHub assignment folder."
    )

# Load the network trained in Part 2, Task 1 (do not train a new one).
with MODEL_PATH.open("r", encoding="utf-8") as f:
    trained = json.load(f)

MEAN = np.array(trained["normalization"]["mean"], dtype=float)
SCALE = np.array(trained["normalization"]["scale"], dtype=float)
W1 = np.array(trained["weights"][0], dtype=float)
W2 = np.array(trained["weights"][1], dtype=float)
B1 = np.array(trained["biases"][0], dtype=float)
B2 = np.array(trained["biases"][1], dtype=float)
CLASSES = trained["classes"]
LABELS = trained["class_labels"]


def classify_on_computer(x, y, z):
    # Part 1, Task 3 sends acceleration divided by 82.
    # Part 2 training data used division by 41; multiply by 2 to match it.
    readings = np.array([x, y, z], dtype=float) * 2

    # Same normalization and neural-network calculations as Part 2, Task 2.
    normalized = (readings - MEAN) / SCALE
    hidden = np.maximum(0, normalized @ W1 + B1)  # ReLU
    scores = hidden @ W2 + B2

    # The largest output score gives the predicted class.
    class_number = int(CLASSES[int(np.argmax(scores))])
    return class_number, LABELS[str(class_number)].upper()


# Original teacher example: track wake/sleep from the advertising packets.
LAST_PACKET_TIME = 0.0
IS_PUCK_AWAKE = False


def callback(device, advertising_data):
    global LAST_PACKET_TIME, IS_PUCK_AWAKE

    if ESPRUINO_MANUFACTURER_ID in advertising_data.manufacturer_data:
        raw_bytes = advertising_data.manufacturer_data[ESPRUINO_MANUFACTURER_ID]

        if len(raw_bytes) >= 12:
            # The Puck sent 3 Float32 values: X, Y, Z (12 bytes).
            x, y, z = struct.unpack("<3f", raw_bytes[:12])
            LAST_PACKET_TIME = time.time()

            if not IS_PUCK_AWAKE:
                print(f"\nPuck Woke Up! [{time.strftime('%H:%M:%S')}]")
                IS_PUCK_AWAKE = True

            # NEW for Part 2, Task 3: run ANN on the computer.
            number, label = classify_on_computer(x, y, z)
            print(
                f"\r[AWAKE] X: {x:+.2f}  Y: {y:+.2f}  Z: {z:+.2f}"
                f"  -> Prediction: {number} = {label}      ",
                end="", flush=True
            )

        elif len(raw_bytes) == 1:
            # Keep the teacher's support for Part 2, Task 2 packets.
            LAST_PACKET_TIME = time.time()
            if not IS_PUCK_AWAKE:
                print(f"\nPuck Woke Up! [{time.strftime('%H:%M:%S')}]")
                IS_PUCK_AWAKE = True

            gesture_icons = {
                0: "LEFT TWIST",
                1: "RIGHT TWIST",
                2: "STRAIGHT",
            }
            prediction_index = raw_bytes[0]
            status_text = gesture_icons.get(prediction_index, "UNKNOWN")
            print(f"\r[AWAKE] Puck prediction: {status_text}      ", end="", flush=True)


async def watchdog_task():
    global LAST_PACKET_TIME, IS_PUCK_AWAKE
    while True:
        await asyncio.sleep(0.5)
        if IS_PUCK_AWAKE and (time.time() - LAST_PACKET_TIME > 2.5):
            print(f"\nPuck Went To Sleep... [{time.strftime('%H:%M:%S')}]")
            print("Waiting for physical movement to wake up...")
            IS_PUCK_AWAKE = False


async def main():
    print(f"Loaded trained neural network from: {MODEL_PATH}")
    print("Waiting for Puck.js physical movement to send measurements...")
    scanner = BleakScanner(
        detection_callback=callback,
        scanning_mode="passive",  # Same as the teachers' Windows example.
    )
    async with scanner:
        await watchdog_task()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nScanning terminated cleanly by user.")
