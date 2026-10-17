 // Assignment 1 - Part 2, Task 2
 // Neural network running ON the Puck.js
 // 0 = LEFT, 1 = RIGHT, 2 = STRAIGHT

 // === 1. TRAINED NEURAL NETWORK PARAMETERS ===

 var inputMean = [-2.073383437321715,4.592881452069098,154.98362166760708];
 var inputScale = [37.43837229459204,110.80588898762778,61.205870594053025];

 var wInputHidden = [
   [-1.102829294858947,9.607408408953964,-0.6537842749088603,1.5814375027133762,-4.894663754437892,-7.9460749064689855,-6.131686707294561,0.8124827717782663],
   [-1.2275764471949158,1.7600027273473275,-4.849143539698306,-0.12499183413695206,2.3553464050501574,1.4276851498366108,-2.1350186795230575,-0.2211676955875747],
   [-1.105829018229849,5.480227740888743,2.910010150134088,5.210326631436265,-1.452761302787214,-6.519689431356998,4.633597051089787,-0.3367215252101547]
 ];

 var bHidden = [-0.9550728295410497,-3.17771062470621,4.401302777678238,-3.1580045276060873,0.8034144309130593,1.8590598138860615,2.0574727244767277,-0.4232424792738134];

 var wHiddenOutput = [
   [-0.056486872247571804,1.3803882419182127,-0.6220548928484566],
   [3.7161915747637875,-3.8549543271463453,-0.28465053257373024],
   [-3.8343029999016096,3.3755061755276716,0.08768957289590341],
   [-3.9718752158281725,0.5485281910043566,3.3339068233657856],
   [-3.8795996070621652,-0.7493943616391309,4.238260661432801],
   [-8.474448581612759,5.597458479872529,2.513506190634878],
   [5.584031862061812,-2.9110178026657283,-0.9399207611069552],
   [1.0120452730304166,0.14731207499823,0.1791563319126727]
 ];

 var bOutput = [-6.700045086545692,1.3518523278769565,3.61954901525484];


 // === 2. NEURAL NETWORK PREDICTION ===

 function classifyTilt(x, y, z) {

   // Normalize the measurements
   var a = (x - inputMean[0]) / inputScale[0];
   var b = (y - inputMean[1]) / inputScale[1];
   var c = (z - inputMean[2]) / inputScale[2];

   // Calculate the 8 hidden neurons
   var h = new Array(8);

   for (var j = 0; j < 8; j++) {

     var sum = bHidden[j]
       + a * wInputHidden[0][j]
       + b * wInputHidden[1][j]
       + c * wInputHidden[2][j];

     // ReLU activation
     h[j] = (sum > 0) ? sum : 0;
   }

   // Calculate the 3 output scores
   var bestClass = 0;
   var bestScore = -Infinity;

   for (var k = 0; k < 3; k++) {

     var score = bOutput[k];

     for (var n = 0; n < 8; n++) {
       score += h[n] * wHiddenOutput[n][k];
     }

     if (score > bestScore) {
       bestScore = score;
       bestClass = k;
     }
   }

   return bestClass;
 }


 // === 3. WAKE-ON-MOVEMENT SETUP ===

 var movement = require("puckjsv2-accel-movement");

 var measurementInterval;
 var active = false;
 var ignoreUntil = 0;


 // === 4. CLASSIFY AND ADVERTISE ===

 function classifyAndAdvertise() {

   var accel = Puck.accel();

   if (!accel || !accel.acc) return;

   // Same measurement scale as the training data
   var x = accel.acc.x / 41;
   var y = accel.acc.y / 41;
   var z = accel.acc.z / 41;

   // Run the neural network on the Puck
   var prediction = classifyTilt(x, y, z);

   // Send a single byte over BLE
   NRF.setAdvertising({}, {
     manufacturer: 0x0590,
     manufacturerData: [prediction],
     connectable: false,
     scannable: false,
     interval: 100
   });
 }


 // === 5. ACTIVE PERIOD ===

 function startActivePeriod() {

   if (active) return;

   active = true;

   // Stop low-power movement detection
   movement.off();

   // Enable accelerometer
   Puck.accelOn();

   // Wake Bluetooth
   NRF.wake();

   // First prediction immediately
   classifyAndAdvertise();

   // Repeat every 100 ms
   measurementInterval = setInterval(
     classifyAndAdvertise, 100
   );

   // Return to sleep after 5 seconds
   setTimeout(goToSleep, 5000);
 }


 // === 6. SLEEP MODE ===

 function goToSleep() {

   // Stop repeated measurements
   if (measurementInterval !== undefined) {
     clearInterval(measurementInterval);
     measurementInterval = undefined;
   }

   // Stop normal accelerometer measurements
   Puck.accelOff();

   // Ignore initial sensor settling
   ignoreUntil = getTime() + 2;

   // Enable low-power movement detection
   movement.on();

   active = false;

   // Stop advertising and sleep
   NRF.setAdvertising({});
   NRF.sleep();
 }


 // === 7. DETECT MOVEMENT ===

 Puck.on("accel", function(a) {

   if (!active && getTime() >= ignoreUntil) {
     startActivePeriod();
   }

 });


 // === 8. INITIAL START ===

 // Wait 10 seconds before first sleep
 // This gives time to disconnect Espruino

 print("P2.T2 loaded: first sleep in 10 seconds.");

 setTimeout(goToSleep, 10000);
