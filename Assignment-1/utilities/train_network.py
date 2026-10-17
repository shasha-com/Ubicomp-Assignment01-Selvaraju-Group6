"""Part 2, Task 1: train a small tilt classifier on the three recorded CSVs.

HOW TO USE
1. Put this file beside straight.csv, lefttwist.csv, righttwist.csv.
2. Install dependencies: python -m pip install numpy scikit-learn
3. Run: python train_network.py

The resulting model_for_puck.json contains the trained weights, biases,
and normalization parameters needed to implement the model on Puck.js.
"""

import json
from pathlib import Path

import numpy as np
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler

# Label numbers come from your assignment: 0=left, 1=right, 2=straight.
DATASETS = [
    ("lefttwist.csv", 0),
    ("righttwist.csv", 1),
    ("straight.csv", 2),
]
BASE_DIR = Path(__file__).resolve().parent

features = []   # The x,y,z measurements (inputs to the network)
labels = []     # The known correct position of each measurement

for filename, label in DATASETS:
    file_path = BASE_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(
            f"Missing {filename}. Put it in the same folder as train_network.py."
        )
    # Each CSV row must contain exactly x,y,z, as sent by puck-data-sender.js.
    readings = np.loadtxt(file_path, delimiter=",", ndmin=2)
    if readings.shape[1] != 3:
        raise ValueError(
            f"{filename} contains {readings.shape[1]} columns; expected 3 (x,y,z)."
        )
    if readings.shape[0] < 5:
        raise ValueError(f"{filename} contains too few readings; please record more.")
    if not np.isfinite(readings).all():
        raise ValueError(f"{filename} contains non-numeric/invalid measurements.")
    print(f"{filename}: {len(readings)} readings")
    features.append(readings)
    labels.extend([label] * len(readings))

X = np.vstack(features)
y = np.asarray(labels, dtype=int)

# Keep 20% of the collected rows aside for a basic accuracy test.
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

# Learn an adjustment from the training rows only.
# These same adjustments must later be applied in the Puck.js program.
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 3 sensor inputs -> 8 hidden neurons -> 3 output classes.
model = MLPClassifier(
    hidden_layer_sizes=(8,),
    activation="relu",
    solver="lbfgs",
    max_iter=2000,
    random_state=42,
)
model.fit(X_train_scaled, y_train)

predicted = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, predicted)
print(f"\nTest accuracy: {accuracy:.1%} ({(predicted == y_test).sum()} / {len(y_test)} correct)")
print("Confusion matrix (rows=true classes; columns=predicted):")
print("Class order: 0=left, 1=right, 2=straight")
print(confusion_matrix(y_test, predicted, labels=[0, 1, 2]))

# Save everything needed for the later on-device implementation.
# The Puck must first normalize x,y,z using 'mean' and 'scale', then
# apply the weight matrices / bias vectors with ReLU in the hidden layer.
export = {
    "input_order": ["x", "y", "z"],
    "class_labels": {"0": "left", "1": "right", "2": "straight"},
    "classes": model.classes_.tolist(),
    "activation": "relu",
    "normalization": {
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
    },
    "weights": [layer.tolist() for layer in model.coefs_],
    "biases": [layer.tolist() for layer in model.intercepts_],
    "test_accuracy": float(accuracy),
    "test_rows": len(y_test),
    "training_rows": len(y_train),
}
output_path = BASE_DIR / "model_for_puck.json"
output_path.write_text(json.dumps(export, indent=2), encoding="utf-8")
print(f"\nSaved weights, biases, and normalization to {output_path.name}")
