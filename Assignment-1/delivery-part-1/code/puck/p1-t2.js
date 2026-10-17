//Task 2 draft (not tested yet)
var measurementInterval;

function measureAndAdvertise() {

  var accel = Puck.accel();

  var a_x = accel.acc.x / 82;
  var a_y = accel.acc.y / 82;
  var a_z = accel.acc.z / 82;

  var floats = new Float32Array([a_x, a_y, a_z]);
  var data = new Uint8Array(floats.buffer);

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


function startActivePeriod() {

  Puck.accelOn();

  measureAndAdvertise();

  measurementInterval =
    setInterval(measureAndAdvertise, 100);

  setTimeout(goToSleep, 5000);
}


function wakeUp() {

  NRF.wake();

  startActivePeriod();
}


function goToSleep() {

  clearInterval(measurementInterval);

  Puck.accelOff();

  NRF.setAdvertising({});

  setTimeout(wakeUp, 5000);

  NRF.sleep();
}


// First start: Bluetooth is already awake,
// so DON'T call NRF.wake()
startActivePeriod();