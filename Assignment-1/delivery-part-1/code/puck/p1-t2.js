// Need to change!

// Cycle:  sleep 5 s  ->  wake  ->  active 5 s (measure + advertise every 100 ms)  ->  sleep ...
// The timer is our "plan to wake up": the MCU sleeps between timer events,
// and the timer interrupt brings it back.

var COMPANY_ID = 0xFFFF;   // 0xFFFF = reserved for testing
var SLEEP_MS   = 5000;     // time spent asleep
var ACTIVE_MS  = 5000;     // time spent measuring + advertising
var SAMPLE_MS  = 100;      // measurement / advertising interval

// Reusable 12-byte buffer: [ax | ay | az], each a 32-bit float
var buf    = new ArrayBuffer(12);
var floats = new Float32Array(buf);
var bytes  = new Uint8Array(buf);

var sampler;               // handle of the 100 ms interval

function sample() {
  var a = Puck.accel().acc;          // acceleration in g
  floats[0] = a.x;
  floats[1] = a.y;
  floats[2] = a.z;

  NRF.setAdvertising({}, {
    manufacturer: COMPANY_ID,
    manufacturerData: bytes,         // exactly 12 bytes
    interval: SAMPLE_MS,
    showName: false
  });
}

function goToSleep() {
  clearInterval(sampler);            // stop measuring
  Puck.accelOff();                   // power down the accelerometer
  NRF.sleep();                       // stop the BLE radio (advertising stops)
  setTimeout(wakeUp, SLEEP_MS);      // timer interrupt will wake us up
}

function wakeUp() {
  NRF.wake();                        // radio back on
  Puck.accelOn(12.5);                // accelerometer on (12.5 Hz > 10 Hz sampling)
  sampler = setInterval(sample, SAMPLE_MS);
  setTimeout(goToSleep, ACTIVE_MS);  // after 5 s go back to sleep
}

wakeUp();                            // start with an active phase