// Task 3 (P1.T3): Wake on shake

var measurementInterval;
var active = false;
var ignoreUntil = 0;

// Low-power movement detection library
var movement = require("puckjsv2-accel-movement");

// Measure acceleration and advertise 12 bytes
function measureAndAdvertise() {

  var accel = Puck.accel();

  var a_x = accel.acc.x / 82;
  var a_y = accel.acc.y / 82;
  var a_z = accel.acc.z / 82;

  // Three 4-byte floats = 12 bytes
  var floats = new Float32Array([a_x, a_y, a_z]);
  var data = new Uint8Array(floats.buffer);

  // BLE advertising
  NRF.setAdvertising({}, {
    manufacturer: 0x0590,
    manufacturerData: data,
    connectable: false,
    scannable: false,
    interval: 100
  });

  print("X:", a_x.toFixed(3),
        "Y:", a_y.toFixed(3),
        "Z:", a_z.toFixed(3));
}

// Start measuring after movement is detected
function startActivePeriod() {

  if (active) return;

  active = true;

  print("MOVEMENT DETECTED - ACTIVE");

  // Stop movement detection mode
  movement.off();

  // Enable normal accelerometer measurements
  Puck.accelOn();

  // Wake Bluetooth
  NRF.wake();

  // Advertise immediately
  measureAndAdvertise();

  // Repeat measurements every 100 ms
  measurementInterval =
    setInterval(measureAndAdvertise, 100);

  // Return to sleep after 5 seconds
  setTimeout(goToSleep, 5000);
}

// Enter low-power mode
function goToSleep() {

  print("GOING TO SLEEP");

  // Stop repeated measurements
  if (measurementInterval !== undefined) {
    clearInterval(measurementInterval);
    measurementInterval = undefined;
  }

  // Stop normal accelerometer measurements
  Puck.accelOff();

  // Ignore initial events while sensor settles
  ignoreUntil = getTime() + 2;

  // Enable low-power movement detection
  movement.on();

  // Mark as inactive
  active = false;

  // Stop Bluetooth advertising
  NRF.setAdvertising({});
  NRF.sleep();
}

// React to accelerometer movement interrupt
Puck.on("accel", function(a) {

  if (!active && getTime() >= ignoreUntil) {
    startActivePeriod();
  }

});

// Wait before initial sleep to finish uploading
print("Program loaded - sleeping in 10 seconds");
setTimeout(goToSleep, 10000);
