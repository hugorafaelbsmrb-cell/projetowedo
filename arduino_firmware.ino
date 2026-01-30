/*
  Firmware Básico para Plataforma CodeKids - v2
  
  Protocolo: COMANDO:VALOR
  - MOTOR:100 (Liga motor PWM pino 3)
  - READ:DIST (Lê sensor de distância) -> Retorna DIST:valor_cm
  - READ:TILT (Lê sensor de inclinação/botão) -> Retorna TILT:0 ou TILT:1
  
  Conexões:
  - Motor: Pino 3 (PWM)
  - Sensor Distância (HC-SR04): Trig 9, Echo 10
  - Sensor Inclinação/Botão: Pino 2
*/

const int PIN_MOTOR = 3;
const int PIN_TILT = 2;
const int PIN_TRIG = 9;
const int PIN_ECHO = 10;

String inputString = "";
bool stringComplete = false;

void setup() {
  Serial.begin(9600);
  
  pinMode(PIN_MOTOR, OUTPUT);
  pinMode(PIN_TILT, INPUT_PULLUP); // Botão/Inclinação normalmente aberto ou fechado
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  
  // Teste
  digitalWrite(PIN_MOTOR, HIGH);
  delay(100);
  digitalWrite(PIN_MOTOR, LOW);
}

void loop() {
  if (stringComplete) {
    processCommand(inputString);
    inputString = "";
    stringComplete = false;
  }
}

void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    if (inChar == '\n') {
      stringComplete = true;
    } else {
      inputString += inChar;
    }
  }
}

void processCommand(String command) {
  command.trim();
  
  if (command.startsWith("MOTOR:")) {
    int speed = command.substring(6).toInt();
    int pwmValue = map(speed, 0, 100, 0, 255);
    analogWrite(PIN_MOTOR, constrain(pwmValue, 0, 255));
    
  } else if (command == "READ:DIST") {
    long duration, cm;
    digitalWrite(PIN_TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(PIN_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_TRIG, LOW);
    
    duration = pulseIn(PIN_ECHO, HIGH, 30000); // Timeout 30ms
    if (duration == 0) cm = 999; // Sem obstáculo
    else cm = duration / 29 / 2;
    
    Serial.print("DIST:");
    Serial.println(cm);
    
  } else if (command == "READ:TILT") {
    int val = digitalRead(PIN_TILT);
    Serial.print("TILT:");
    Serial.println(val == LOW ? 1 : 0); // Invertido se usar INPUT_PULLUP e fechar p/ terra
  }
}
