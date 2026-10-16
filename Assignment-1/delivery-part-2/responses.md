# Task 1

## 1. Estimation of the power consumption

**Estimation of the average current draw during the awake cycle (5s):**

- The accelerometer is active and samples data every 100ms.
- The NRF radio is advertising continuously with a tight interval of 100ms.

Based on the hardware specifications, here are the estimated current draws:

- **Accelerometer active:** assuming it operates in the documented 12.5 Hz accelerometer/gyroscope mode, drawing approximately 0.35 mA.
- **NRF radio advertising:** The documented default advertising current is 0.04 mA at a 375 ms interval. Scaling this approximately to a 100 ms interval gives 0.04 × (375 / 100) = 0.15 mA.

**Total average current draw during the awake cycle:** 0.35 + 0.15 = 0.50 mA.

**Estimation of the overall average current draw over a 10s cycle (5s awake + 5s asleep):**

Average Current Draw = (I_awake × t_awake) / t_awake = I_awake
= (0.50 mA × 10s) / 10s
= 0.50 mA

## 2. Interpretation of power consumption measurements

**Measurement:**

Average current measurement: 1.17 mA

The estimated average current during the awake phase was 0.85 mA. In comparison, the measured average current over the displayed 2.301-second active window was 1.18 mA, approximately 38.8% higher than estimated. This suggests that the simplified model underestimated awake-state consumption. Possible reasons include the approximate scaling used to estimate Bluetooth advertising current at a 30 ms interval and additional processing associated with executing JavaScript and reading sensor data. However, the measurement represents total device current, so individual component contributions cannot be determined from this trace. The sleep-current estimate of 0.003 mA and overall-cycle estimate of 0.4265 mA remain unvalidated because separate sleep and complete 10-second-cycle measurements have not yet been selected.

## P1.Q1: How long would the CR2032 last? Explain your calculation.

Using my measured average current of 1.32 mA, a CR2032 with a nominal capacity of 225 mAh would last 7 days of continuous operation.

**Calculations:**

Battery life ≈ battery capacity ÷ average current consumption

- Battery capacity: A Panasonic CR2032 has a nominal capacity of 220 mAh
- Average current: Based on our measurements, 1.32 mA

Battery life (hours) = battery capacity ÷ average current consumption
= 220 ÷ 1.32
≈ 166.66 hours
≈ 7 days

---

# Task 2

## 1. Estimation of the power consumption

**Estimation of the average current draw during the awake cycle (5s):**

- The accelerometer is active and samples data every 100ms.
- The NRF radio is advertising continuously with a tight interval of 100ms.

Based on the hardware specifications, here are the estimated current draws:

- **Accelerometer active:** assuming it operates in the documented 12.5 Hz accelerometer/gyroscope mode, drawing approximately 0.35 mA.
- **NRF radio advertising:** The documented default advertising current is 0.04 mA at a 375 ms interval. Scaling this approximately to a 100 ms interval gives 0.04 × (375 / 100) = 0.15 mA.

**Total average current draw during the awake cycle:** 0.35 + 0.15 = 0.50 mA.

**Estimation of the average current draw during the sleep cycle (5s):**

- The accelerometer is turned off.
- The NRF radio is not advertising.

Based on the hardware specifications, here are the estimated current draws:

- **Accelerometer off:** assumed negligible for this estimate
- **NRF radio off:** no advertising current

**Total average current draw during the sleep cycle:** 0.003 mA (3 µA), based on the documented sleep current with Bluetooth advertising disabled.

**Estimation of the overall average current draw over a 10s cycle (5s awake + 5s asleep):**

Average current draw = (I_awake × t_awake + I_sleep × t_sleep) / (t_awake + t_sleep)
= (0.50 mA × 5s + 0.003 mA × 5s) / 10s
= 0.2515 mA

## 2. Interpretation of the power consumption measurements

Measured average current is ~0.63-0.68 mA, about 2.5x higher than the estimated 0.25 mA. The 5 s awake / 5 s sleep timing is confirmed, but the current in both phases is higher than estimated.

**Measurements:**

- **Awake (~5.06 s):** 1.06 mA avg
- **Sleep (~4.97 s):** 0.202 mA avg
- **Full cycle (~10 s):** 0.626 mA (selection), 0.684 mA (24.34 s window)

**Awake:**

**Asleep:**

**Full 10Sec Cycle:**

## P1.Q2: We are now effectively active only half the time. But why is the energy consumption for a 10s cycle not half of what you saw in P1.T1?

Even though the Puck is active for only 5 out of 10 seconds (50%), its energy consumption is not exactly half because it still consumes power while sleeping. Also waking up and restarting the BLE radio has an energy cost. Hence, the savings depend on how much cheaper sleep is than activity, rather than just how long the Puck sleeps.

**Our measurements show:**

- **Low-current state:** ~0.20 mA average (a ~0.6 mA tail for ~0.7 s after each burst, then a floor of ~0.1 mA or less)
- **Active bursts:** ~1.06 mA average, with current mostly between 1 and 3 mA and spikes up to 6-7.5 mA
- **Overall average:** Assuming equal durations, the expected average is (1.06 + 0.20) / 2 = 0.63 mA, which closely matches the measured 0.63 mA (6.35 mC over 10.06 s).

The energy consumption over a 10-second cycle is not half that of P1.T1 because the Puck keeps drawing power in its low-current phase and pays a wake-up and radio restart cost at the start of each burst. Our measurements show the low-current state averages ~0.20 mA, while the active bursts average ~1.06 mA. Assuming equal durations, the estimated average is (1.06 + 0.20) / 2 = 0.63 mA, which agrees with the measured value. Therefore, consumption does not halve, because the low-current state is not equivalent to zero-power sleep.

---

# Task 3

## 1. Estimation of the power consumption

**Estimation of the average current draw during the awake cycle (5s):**

- The accelerometer is active and samples data every 100ms.
- The NRF radio is advertising continuously with a tight interval of 100ms.

Based on the hardware specifications, here are the estimated current draws:

- **Accelerometer active:** assuming it operates in the documented 12.5 Hz accelerometer/gyroscope mode, drawing approximately 0.35 mA.
- **NRF radio advertising:** The documented default advertising current is 0.04 mA at a 375 ms interval. Scaling this approximately to a 100 ms interval gives 0.04 × (375 / 100) = 0.15 mA.

**Total average current draw during the awake cycle:** 0.35 + 0.15 = 0.50 mA.

**Estimation of the average current draw during the sleep cycle (5s):**

The MCU is asleep and the radio is not advertising, but the accelerometer must stay on to detect the shake and trigger the wake-up interrupt. This is the key difference from P1.T2, where the accelerometer was off during sleep.

- **NRF MCU/radio asleep:** 0.003 mA (3 µA).
- **Accelerometer kept on in motion-detection mode:** assumed 0.35 mA (the same 12.5 Hz mode, as a conservative estimate).

**Total average current draw during the sleep cycle:** 0.003 + 0.35 = 0.353 mA.

**Estimation of the overall average current draw over a 10s cycle (5s awake + 5s asleep):**

Unlike P1.T2, the duty cycle here is not fixed, because it depends on how often the Puck is shaken. The 5s/5s split is an assumption so the numbers are comparable. Two other cases:

- **Never shaken:** the Puck stays in the sleep state, so the average is 0.353 mA.
- **Shaken once per minute (5s awake, 55s asleep):** (0.50 × 5 + 0.353 × 55) / 60 ≈ 0.365 mA.

## 2. Interpretation of the power consumption measurements

The measured sleep current (1.36 mA) is about 4× higher than our estimate (0.353 mA) and far above the 3 µA of a true sleep state. So the Puck is not in deep sleep while waiting for a shake. Likely causes are the accelerometer running in a normal mode for motion detection, or a constant baseline from the board or measurement setup.

The awake current (1.75 mA) is also higher than the estimated 0.50 mA, and the spikes up to 8.55 mA are the radio advertising events.

Because sleep (1.36 mA) is close to awake (1.75 mA), the saving from sleeping is small, which is why the overall average (about 1.6 mA) is not much below always-on.

**Awake (after a Shake):**
ref: `Assignment-1\delivery-part-1\images\ppk-screenshot-p1t3.1.jpeg`

**Sleep (waiting for a Shake):**
ref: `Assignment-1\delivery-part-1\images\ppk-screenshot-p1t3.2.jpeg`

## P1.Q3: (a) Is there a difference between sleep-phase current and the current profile? If so, why? (b) How long (days/months/years) will the CR2032 battery last if the puck is moved 10 times a day?

Yes, there is a difference between sleep-phase current and the current profile.

In the sleep phase the puck draws a steady current of 1.36 mA. After a shake, the current goes up about 2-3 mA with short spikes of up to 8.5 mA. This is because when awake, the Puck reads the accelerometer and sends a BLE advertisement every 100ms. The spikes are the radio sending. When sleeping, the CPU and radio are off, but some parts (like the accelerometer, which watches for movement) stay on.

Battery life ≈ battery capacity ÷ average current consumption

- Battery capacity = 210–240 mAh
- Active time per day = 10 × 5s = 50s
- Sleep current = 1.36 mA × 24h ≈ 32.6 mAh per day
- Battery life = 240 ÷ 32.6 ≈ 7 days