const admin = require("firebase-admin");

// Load service account key
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 👉 Replace this with your actual Firebase Auth UID
// replace with your actual UID inside quotes
const uid = "oMtYAP9ZqqPi7y8X64f6mxg9IFj2";

;

async function setAdmin() {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ User ${uid} has been set as admin`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting admin claim:", error);
    process.exit(1);
  }
}

setAdmin();
