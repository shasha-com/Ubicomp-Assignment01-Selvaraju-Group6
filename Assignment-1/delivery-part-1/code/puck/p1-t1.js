Puck.accelOn();

setInterval(function() {
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

  print("X:", a_x.toFixed(3), "Y:", a_y.toFixed(3), "Z:", a_z.toFixed(3));
}, 100);