// Need to change!

// movement sensitivity may need tuning
// Sleeping : radio off, accelerometer in ultra-low-power "movement detect" mode.
//            The LSM6DS3TR-C pokes the nRF52 through an interrupt when moved.
// Active   : for 5 s, read ax/ay/az every 100 ms and advertise the 12 bytes.
// Then go back to sleep until the next shake.

var COMPANY_ID = 0xFFFF;   // 0xFFFF = reserved for testing
var ACTIVE_MS  = 5000;     // how long we stay awake after a shake
var SAMPLE_MS  = 100;      // measurement / advertising interval
var SETTLE_S   = 1;        // ignore "movement" events this long after re-arming

var buf    = new ArrayBuffer(12);          // [ax | ay | az] as 3 x float32
var floats = new Float32Array(buf);
var bytes  = new Uint8Array(buf);

var active = false;        // true while measuring + advertising
var ignoreUntil = 0;       // time (s) before which movement events are ignored
var sampler;               // 100 ms interval handle
var sleepTimer;            // 5 s timeout handle

function sample() {
  var a = Puck.accel().acc;                // acceleration in g
  floats[0] = a.x;
  floats[1] = a.y;
  floats[2] = a.z;
  NRF.setAdvertising({}, {
    manufacturer: COMPANY_ID,
    manufacturerData: bytes,               // exactly 12 bytes
    interval: SAMPLE_MS,
    showName: false
  });
}

function wake() {
  active = true;
  require("puckjsv2-accel-movement").off();   // leave movement-detect mode
  NRF.wake();                                 // radio back on
  Puck.accelOn(12.5);                         // normal accelerometer mode
  sampler = setInterval(sample, SAMPLE_MS);
  sleepTimer = setTimeout(sleep, ACTIVE_MS);  // back to sleep after 5 s
}

function sleep() {
  active = false;
  clearInterval(sampler);
  clearTimeout(sleepTimer);
  Puck.accelOff();
  ignoreUntil = getTime() + SETTLE_S;         // let the sensor settle first
  require("puckjsv2-accel-movement").on();    // arm the motion interrupt
  NRF.sleep();                                // radio off
}

// Fired by the accelerometer interrupt. In movement mode it means "we were moved".
// (While active it also fires on every sample; those events are ignored.)
Puck.on('accel', function (a) {
  if (active) return;
  if (getTime() < ignoreUntil) return;
  wake();
});

// Start awake so you can still connect with the Web IDE for the first 5 s
// (and shake the Puck any time later to wake it again).
require("puckjsv2-accel-movement").on();
wake();