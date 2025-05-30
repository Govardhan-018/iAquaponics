#include <WiFi.h>
#include <HTTPClient.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* ssid = "Suspected";
const char* password = "just-go123";

// For HTTP data upload
const char* httpServer = "http://192.168.173.131:3000/upload"; // Change to your IP

// For WebSocket to receive LED control commands
WebSocketsClient webSocket;

const int ledPin = 2;

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
    if (msgType && strcmp(msgType, "led") == 0) {
      bool ledState = doc["state"];
      digitalWrite(ledPin, ledState ? HIGH : LOW);
      Serial.print("LED set to: ");
      Serial.println(ledState ? "ON" : "OFF");
    }
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  pinMode(ledPin, OUTPUT);

  Serial.println("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // CONNECT TO RAW WEBSOCKET (not socket.io)
  webSocket.begin("192.168.173.131", 3000, "/espws"); // This must match server path
  webSocket.onEvent(webSocketEvent);
}

unsigned long lastSentTime = 0;
const long interval = 10000; // Send sensor data every 10 sec

void loop() {
  webSocket.loop();

  if (WiFi.status() == WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastSentTime > interval) {
      lastSentTime = now;

      // Prepare dummy sensor data
      String data = "{\"temp\":24.5,\"humidity\":55}";

      HTTPClient http;
      http.begin(httpServer);
      http.addHeader("Content-Type", "application/json");

      int httpResponseCode = http.POST(data);
      Serial.print("HTTP POST Response: ");
      Serial.println(httpResponseCode);

      http.end();
    }
  }
}
