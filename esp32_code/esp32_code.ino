#include <WiFi.h>
#include <HTTPClient.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <DHT_U.h>

#define DHTPIN 14  // Digital pin connected to the DHT11
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

#define trigPin 32
#define echoPin 33

const float tankHeight = 30.0;

const char* ssid = "Suspected";
const char* password = "just-go123";

// For HTTP data upload
const int port = 3069;
const char* server = "192.168.204.131";
String httpServer = "http://" + String(server) + ":3069/upload";


// For WebSocket to receive LED control commands
WebSocketsClient webSocket;

const int motorPin = 26;
const int valPin = 25;
const int tdsPin = 27;

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  if (type == WStype_TEXT) {
    StaticJsonDocument<200> doc;
    DeserializationError err = deserializeJson(doc, payload);

    if (err) {
      Serial.print("deserializeJson() failed: ");
      Serial.println(err.f_str());
      return;
    }

    const char* msgType = doc["type"];
    if (msgType) {
      if (strcmp(msgType, "motor") == 0) {
        bool motorState = doc["state"];
        digitalWrite(motorPin, motorState == 1 ? HIGH : LOW);  // if active LOW
        Serial.print("Motor set to: ");
        Serial.println(motorState);
      } else if (strcmp(msgType, "valve") == 0) {
        bool valState = doc["state"];
        digitalWrite(valPin, valState == 1 ? HIGH : LOW);
        Serial.print("Valve set to: ");
        Serial.println(valState);
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(ssid, password);
  pinMode(motorPin, OUTPUT);
  pinMode(valPin, OUTPUT);
  pinMode(tdsPin, OUTPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.println("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // CONNECT TO RAW WEBSOCKET (not socket.io)
  webSocket.begin(server, port, "/espws");  // This must match server path
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);  // Reconnect every 5 seconds if disconnected
}

unsigned long lastSentTime = 0;
const long interval = 500; 
//tds
float readTds() {
  int tdsValue = analogRead(tdsPin);
  float tds = tdsValue * (3.3 / 4095.0);
  Serial.println(tdsValue);
  // float tds = (voltage * 1000) / 1.75;
  return tds;
}

float level() {
  long duration;
  float distance, waterLevelPercent;

  // Clear and trigger the ultrasonic sensor
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Measure the time of echo
  duration = pulseIn(echoPin, HIGH);
  distance = (duration * 0.0343) / 2;  // Distance to water surface in cm

  // Calculate water level
  if (distance >= 0 && distance <= tankHeight) {
    waterLevelPercent = ((tankHeight - distance) / tankHeight) * 100;
  } else {
    waterLevelPercent = 0;  // out of range
  }
  return waterLevelPercent;
}

void loop() {
  webSocket.loop();

  if (WiFi.status() == WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastSentTime > interval) {
      lastSentTime = now;

      // Prepare dummy sensor data
      float tds = readTds();
      float humi = dht.readHumidity();
      float temp = dht.readTemperature();
      float waterLevel = level();
      String data = "{\"temp\":" + String(temp) + ",\"humidity\":" + String(humi) + ",\"tds\": " + String(tds) + ",\"level\": " + String(waterLevel) + "}";

      HTTPClient http;
      http.begin(httpServer);
      http.addHeader("Content-Type", "application/json");

      http.setTimeout(1000);  // Timeout in milliseconds
      int httpResponseCode = http.POST(data);
      Serial.print("HTTP POST Response: ");
      Serial.println(httpResponseCode);
      http.end();
    }
  }
}
