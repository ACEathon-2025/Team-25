// demo.js - SMARTFISHING COMPETITION SERVER (Twilio Enabled)
const http = require('http');
const twilio = require('twilio');

// ==================== CONFIGURATION (Environment Variables) ====================
const CONFIG = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'AC9b2c6463fadf90bbd18ba6ac704436b0',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'e8e29b9e9c8ae857c31ef74ab26dfcdf',
    twilioPhoneNumber: '+12294591257',
    port: process.env.PORT || 3000,
    emergencyContacts: {
        coast_guard: '+918660434815',     // Indian Coast Guard
        family: [
            '+918951632232',              // Family member 1
        ],
        nearby_boats: [],
    }
};
// ===================================================================================

// Initialize Twilio client
let client;
try {
    if (!CONFIG.accountSid || !CONFIG.authToken) {
        throw new Error('Twilio credentials missing from CONFIG.');
    }
    
    // Validate Twilio credentials format
    if (!CONFIG.accountSid.startsWith('AC') || CONFIG.authToken.length !== 32) {
        throw new Error('Invalid Twilio credentials format.');
    }
    
    client = twilio(CONFIG.accountSid, CONFIG.authToken);
    console.log('✅ Twilio client initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
    console.log('💡 Using demo mode only. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables for real SMS.');
    client = null;
}

// Helper function for sending JSON responses
function sendJsonResponse(res, statusCode, data) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = statusCode;
    res.end(JSON.stringify(data));
}

// ====================== HANDLERS ======================

function handleSensors(req, res) {
    console.log('📡 Sending live sensor data...');
    sendJsonResponse(res, 200, {
        success: true,
        data: {
            temperature: "28.5°C",
            ph: "7.8",
            location: "19.0760° N, 72.8777° E",
            battery: "87%",
            oxygen: "6.2 mg/L",
            salinity: "35.1 ppt"
        }
    });
}

function handlePredictions(req, res) {
    console.log('🤖 Sending AI fishing predictions...');
    sendJsonResponse(res, 200, {
        success: true,
        zones: [
            {
                name: "Zone A - North East",
                confidence: "HIGH",
                fish: "Tuna, Mackerel (40-50kg)",
                distance: "2.3 km from current position",
                reason: "Optimal temperature & high plankton concentration"
            },
            {
                name: "Zone B - South West",
                confidence: "MEDIUM",
                fish: "Sardines, Pomfret (25-35kg)",
                distance: "1.7 km from current position",
                reason: "Good pH levels & current patterns"
            },
            {
                name: "Zone C - Deep Waters",
                confidence: "LOW",
                fish: "Kingfish, Snapper (15-25kg)",
                distance: "4.1 km from current position",
                reason: "Distance outweighs potential catch"
            }
        ],
        efficiency: "40% higher catch rate than traditional methods"
    });
}

function handleEmergency(req, res) {
    console.log('🚨 EMERGENCY SOS TRIGGERED (Simulated Response)');
    sendJsonResponse(res, 200, {
        success: true,
        message: "🚨 EMERGENCY ALERT! Help is on the way!",
        alert: "Coast Guard & nearby vessels notified via satellite",
        location: "19.0760° N, 72.8777° E (Arabian Sea)",
        timestamp: new Date().toLocaleString(),
        response_time: "Estimated 15-20 minutes",
        instructions: "Stay with boat, activate flotation devices"
    });
}

async function handleEmergencySms(req, res) {
    console.log('📱 EMERGENCY SMS ENDPOINT TRIGGERED');

    let body = '';
    req.on('data', chunk => body += chunk.toString());

    req.on('end', async () => {
        try {
            const data = JSON.parse(body);
            const { fishermanId, location, message } = data;
            const isRealSms = data.realSms || false;

            if (!fishermanId || !location || !message) {
                return sendJsonResponse(res, 400, {
                    success: false,
                    message: "Missing required fields: fishermanId, location, or message."
                });
            }

            // ============ REAL SMS MODE ============
            if (isRealSms) {
                if (!client) {
                    return sendJsonResponse(res, 503, {
                        success: false,
                        message: "Twilio client not initialized. Check credentials or connection.",
                        note: "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables"
                    });
                }

                console.log('🚨 Sending REAL emergency SMS via Twilio...');

                // *** MINIMAL MESSAGE TO BYPASS CARRIER FILTERING ***
                const emergencyMessage = `SOS! Vessel distress at ${location.lat}°N, ${location.lng}°E. Fisher: ${fishermanId}. Immediate assistance required.`;

                const smsResults = {
                    coast_guard: false,
                    family_contacts: 0,
                    nearby_boats: 0,
                    total_sent: 0,
                    errors: [],
                    real_sms: true,
                };
                
                const contacts = [
                    { number: CONFIG.emergencyContacts.coast_guard, type: 'Coast Guard', key: 'coast_guard' },
                    ...CONFIG.emergencyContacts.family.map(num => ({ number: num, type: 'Family', key: 'family_contacts' })),
                    ...CONFIG.emergencyContacts.nearby_boats.map(num => ({ number: num, type: 'Boat', key: 'nearby_boats' })),
                ];

                let hasSuccessfulSend = false;

                for (const contact of contacts) {
                    if (!contact.number) continue; 
                    
                    try {
                        console.log(`📤 Attempting to send SMS to ${contact.type}: ${contact.number}`);
                        
                        const message = await client.messages.create({
                            body: emergencyMessage,
                            from: CONFIG.twilioPhoneNumber,
                            to: contact.number
                        });
                        
                        console.log(`✅ SMS sent successfully to ${contact.type}: ${contact.number} (SID: ${message.sid})`);
                        
                        if (contact.key === 'coast_guard') {
                            smsResults.coast_guard = true;
                        } else {
                            smsResults[contact.key]++;
                        }
                        smsResults.total_sent++;
                        hasSuccessfulSend = true;
                        
                    } catch (err) {
                        const errorMessage = err.message || JSON.stringify(err);
                        const errorCode = err.code || 'UNKNOWN_ERROR';
                        smsResults.errors.push(`${contact.type} (${contact.number}): ${errorMessage} [Code: ${errorCode}]`);
                        console.error(`❌ SMS failed for ${contact.type} (${contact.number}):`, errorMessage, `[Code: ${errorCode}]`);
                    }
                }

                const success = hasSuccessfulSend || smsResults.total_sent > 0;
                
                sendJsonResponse(res, success ? 200 : 500, {
                    success: success,
                    message: success 
                        ? (smsResults.errors.length > 0 ? "⚠️ Alerts partially sent. Check errors for details." : "🚨 REAL EMERGENCY SMS ALERTS SENT SUCCESSFULLY!")
                        : "❌ Failed to send any SMS alerts.",
                    sms_results: smsResults,
                    alert: {
                        fisherman_id: fishermanId,
                        location: location,
                        message: message,
                        timestamp: new Date().toISOString(),
                        rescue_eta: "15-20 minutes"
                    },
                    note: smsResults.errors.length > 0 
                        ? "Check server console for detailed Twilio error codes."
                        : "All messages sent successfully."
                });
            }

            // ============ DEMO MODE ============
            else {
                console.log('🧪 DEMO MODE: SMS simulation active');
                sendJsonResponse(res, 200, {
                    success: true,
                    message: "🧪 DEMO MODE: Emergency SMS system simulated successfully.",
                    sms_results: {
                        coast_guard: true,
                        family_contacts: CONFIG.emergencyContacts.family.length,
                        nearby_boats: CONFIG.emergencyContacts.nearby_boats.length,
                        total_sent: CONFIG.emergencyContacts.family.length + CONFIG.emergencyContacts.nearby_boats.length + 1,
                        real_sms: false
                    },
                    alert: {
                        fisherman_id: fishermanId,
                        location: location,
                        message: message,
                        timestamp: new Date().toISOString()
                    },
                    note: "No real SMS sent. Use realSms:true for live Twilio alerts."
                });
            }

        } catch (err) {
            console.error('❌ SMS Processing Error:', err.message);
            sendJsonResponse(res, 500, {
                success: false,
                message: "Internal server error processing emergency request.",
                error: err.message
            });
        }
    });
}

function handleDefault(req, res) {
    sendJsonResponse(res, 200, {
        success: true,
        message: "🌊 SmartFishing AI Ocean Monitoring System - LIVE",
        version: "2.4 Competition Edition (Enhanced Error Handling)",
        features: [
            "Real-time Ocean Sensor Monitoring",
            "AI-Powered Fishing Zone Predictions",
            "Emergency SOS with GPS Tracking",
            "Multi-channel SMS Alert System",
            "Twilio Integrated Communications"
        ],
        twilio_status: client ? "ACTIVE ✅" : "INACTIVE ⚠️",
        server_time: new Date().toISOString(),
        note: client ? "SMS system ready" : "SMS in demo mode - set environment variables for real SMS"
    });
}

// ====================== SERVER SETUP (CORS FIX APPLIED HERE) ======================
const server = http.createServer((req, res) => {
    console.log(`📡 Request received: ${req.method} ${req.url}`);

    // ====================== UNIVERSAL CORS HEADERS (THE FIX) ======================
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE'); 
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With'); 
    res.setHeader('Content-Type', 'application/json');
    // ==============================================================================

    // ====================== HANDLE CORS PREFLIGHT (OPTIONS) REQUESTS ======================
    if (req.method === 'OPTIONS') {
        console.log('🔗 Responding to CORS OPTIONS preflight request (SUCCESS).');
        res.statusCode = 204; // 204 No Content is the standard response
        return res.end();
    }
    // ====================================================================================

    // ROUTING LOGIC
    if (req.url === '/sensors' && req.method === 'GET') {
        return handleSensors(req, res);
    } else if (req.url === '/predict' && req.method === 'GET') {
        return handlePredictions(req, res);
    } else if (req.url === '/emergency' && req.method === 'POST') {
        return handleEmergency(req, res);
    } else if (req.url === '/emergency-sms' && req.method === 'POST') {
        return handleEmergencySms(req, res);
    } else {
        return handleDefault(req, res);
    }
});

// ====================== START SERVER ======================
server.listen(CONFIG.port, () => {
    console.log('\n🎯 🎯 🎯 SMARTFISHING DEMO SERVER READY 🎯 🎯 🎯');
    console.log('📍 Server running at: http://localhost:' + CONFIG.port);
    console.log('📱 Twilio Status:', client ? "ACTIVE ✅" : "INACTIVE ⚠️");
    console.log('📞 Your Twilio Number:', CONFIG.twilioPhoneNumber);
    console.log('🔐 Using Account SID:', CONFIG.accountSid.substring(0, 8) + '...');
    
    if (!client) {
        console.log('🚨 IMPORTANT: Twilio is INACTIVE. To enable real SMS:');
        console.log('   1. Set TWILIO_ACCOUNT_SID environment variable');
        console.log('   2. Set TWILIO_AUTH_TOKEN environment variable');
        console.log('   3. Restart the server');
    }
    
    console.log('🚀 Features Enabled: Sensors | AI Predictions | Emergency SOS | ' + (client ? 'Real SMS Alerts' : 'Demo SMS Alerts'));
    console.log('=============================================================\n');
});

// Handle server errors gracefully
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${CONFIG.port} is already in use. Try a different port.`);
    } else {
        console.error('❌ Server error:', error.message);
    }
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down SmartFishing server gracefully...');
    server.close(() => {
        console.log('✅ Server closed successfully.');
        process.exit(0);
    });
});
