# Team-25
# 🌊 SmartFishing – Safe, Smart & Sustainable Fishing for Local Communities

<img width="358" height="358" alt="Screenshot 2025-10-07 213940" src="https://github.com/user-attachments/assets/1ecfda21-b463-4db4-92f9-da80f6fe1a9d" />

### 🚀 ACEathon 2025 | Online Phase Submission

- **Team Name:** Team Hydra
- **Member Names:** Tushar J Kumar and Abhishek SM
- **Project Duration:** 4th – 10th October 2025  
- **Category:** IoT + AI for Social Impact

---

## 🧩 Problem Statement

Local fishermen face **unpredictable weather, unsafe waters, and poor yield prediction** due to the lack of affordable real-time technology support.  
This leads to accidents, lower income, and reduced sustainability in local fishing practices.

> “Our goal is to empower fishermen with real-time safety alerts and predictive insights using affordable smart technology.”

---

## 💡 Our Solution – SmartFishing

**SmartFishing** is an IoT + AI-based system that helps fishermen make safe and smart decisions through:
- Real-time **weather, current, and temperature data**
- **Predictive fishing zones** using AI analytics
- **SOS and alert system** for safety
- **Offline SMS notifications** for low-network areas

Fishermen receive instant updates on a **mobile dashboard or SMS**, ensuring safety and efficiency even in remote locations.

---

## ⚙️ System Architecture

**IoT Sensors** (Temp, pH, GPS) --> **Cloud Server** (FastAPI, DB) --> **AI/ML Engine** (Prediction) --> **Mobile / SMS** (Dashboard, Alerts)

---

## 🧠 Key Features

| Feature | Description |
|----------|--------------|
| 🌡️ **Real-Time IoT Data** | Monitors temperature, pH, and water current using affordable sensors. |
| ☁️ **Weather Forecast** | Integrates with satellite APIs (OpenWeatherMap) for live updates. |
| 📍 **Predictive Fishing Zones (P-FZ)** | AI model trained on environmental data to predict optimal fishing spots. |
| 🚨 **SOS Emergency Alerts** | One-click emergency alert for fishermen in danger. |
| 📲 **Mobile & Web Dashboard** | Clean, responsive interface showing live data and alerts. |
| 📡 **Offline SMS Support** | Works even in low or no internet areas. |

---

## 🧰 Tech Stack

| Layer | Technology Used |
|--------|------------------|
| **Hardware** | ESP32 / Arduino, DS18B20 (Temp), pH Sensor, GPS Module |
| **Backend** | Python (Flask), Node.js (optional API) |
| **AI/ML** | Python, Scikit-learn, TensorFlow |
| **Frontend** | HTML, CSS, JavaScript / React (optional) |
| **Database** | Firebase / MongoDB |
| **APIs** | OpenWeatherMap, Google Maps API |
| **Connectivity** | LoRaWAN / MQTT / WiFi |
| **Version Control** | Git & GitHub |

---

## 🔄 Workflow

1. IoT sensors collect real-time data from the river.  
2. Data is sent to the cloud via WiFi/LoRa.  
3. The AI engine analyzes environmental parameters to predict safe fishing zones.  
4. Fishermen receive updates through the **mobile dashboard** or **SMS alerts**.  
5. SOS button instantly notifies nearby boats or rescue centers.  

---

## 🧪 AI Model Overview

- **Input Parameters:** Temperature, pH, Current speed, Weather conditions  
- **Output:** Safe Fishing Probability (0–100%)  
- **Model Used:** Random Forest / Decision Tree Classifier  
- **Training Data:** Simulated + open-source water quality datasets  
- **Performance:** ~87% accuracy on test data  

---

## 🖥️ UI/UX Design

### Dashboard Layout:
- **Header:** Displays live weather and temperature info  
- **Map Section:** Real-time fishing zone visualization  
- **Data Cards:** Water parameters (Temp, pH, Current speed)  
- **SOS Button:** Prominent red icon for emergencies  
- **Color Scheme:** Ocean Blue (#0077b6), White, Light Green  

> Designed for clarity, accessibility, and visibility under sunlight on fishing boats.

---

## 📸 Prototype Screens

| Screen | Description |
|--------|--------------|
| Dashboard | Home dashboard showing current weather and water data |
| Fishing Zone | Fishing zone map with AI-based predictions |
| SOS | SOS and alert panel with offline support |
<img width="205" height="307" alt="Screenshot 2025-10-07 214247" src="https://github.com/user-attachments/assets/089871dd-f72e-4e8b-b6ff-62b5ab934559" />

---

## 🧾 How to Run Locally

### Clone the repository:
```bash
git clone https://github.com/<your-username>/SmartFishing.git
cd SmartFishing


