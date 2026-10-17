import asyncio
from bleak import BleakScanner, BleakClient

#================================== CONFIGURATION ========================================
# Change this to 'lefttwist.csv' / 'righttwist.csv' when collecting your gesture dataset!
OUTPUT_FILE = "righttwist.csv" 

PUCK_NAME = "Puck.js e826"  # The name of your Puck.js device as seen in the Web IDE


#=============================================================================================================
NUS_RX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

string_buffer = ""

def handle_ble_data(sender, data):
    global string_buffer
    try:
        incoming_chunk = data.decode('utf-8')
        string_buffer += incoming_chunk

        while "\n" in string_buffer:
            line, string_buffer = string_buffer.split("\n", 1)
            line = line.strip()
            
            if line:
                # Skip any system messages that contain alphabetic characters or specific symbols
                if any(char.isalpha() or char in ['<', '>', 'S'] for char in line):
                    print(f"Skipped system message: {line}")
                    continue                
                print(f"Received data: {line}")

                with open(OUTPUT_FILE, "a") as f:
                    f.write(line + "\n")
                    
    except Exception as e:
        print(f"Error handling chunk: {e}")

async def main():
    print("Scanning for your Puck.js device...")
    
    device = await BleakScanner.find_device_by_name(PUCK_NAME)
    if not device:
        print(f"Could not find a device named '{PUCK_NAME}'. Make sure it's turned on and disconnected from the Web IDE!")
        return

    print(f"Found Puck.js at address [{device.address}]. Connecting...")

    # Establish connection and subscribe to the data stream
    async with BleakClient(device) as client:
        print("Connected successfully! Press and hold the Puck button to stream data.")
        print(f"Saving data row packets into: {OUTPUT_FILE}")
        print("Press Ctrl+C in this terminal to exit when finished.")
        
        await client.start_notify(NUS_RX_UUID, handle_ble_data)
        
        while True:
            await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nCollection stopped. File updated successfully.")
