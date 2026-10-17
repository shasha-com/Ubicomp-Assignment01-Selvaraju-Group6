// Part 1: The Right way to sleep

Puck.accelOn();

setInterval(function() {
  var accel = Puck.accel();

  var a_x = accel.acc.x / 82;
  var a_y = accel.acc.y / 82;
  var a_z = accel.acc.z / 82;

  print("X:", a_x, "Y:", a_y, "Z:", a_z);
}, 100);