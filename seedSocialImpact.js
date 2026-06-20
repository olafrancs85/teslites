// seedSocialImpact.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedProjects() {
  const projects = [
    {
      title: "Sustainability Projects",
      description:
        "Driving green initiatives, recycling, and eco-friendly practices across communities.",
      imageUrl: "/images/sustainability.jpg",
      category: "Sustainability",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      title: "EV Charging Outreach",
      description:
        "Expanding EV charging access and promoting clean transportation.",
      imageUrl: "/images/charging.jpg",
      category: "EV Charging",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      title: "Community Volunteering",
      description:
        "Supporting local causes through volunteering and charity drives.",
      imageUrl: "/images/volunteering.jpg",
      category: "Community",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      title: "Education & Innovation",
      description:
        "Empowering the next generation with knowledge, skills, and innovation.",
      imageUrl: "/images/education.jpg",
      category: "Education",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  for (const project of projects) {
    await db.collection("socialImpact").add(project);
    console.log(`✅ Seeded: ${project.title}`);
  }

  console.log("🌱 All socialImpact projects seeded!");
  process.exit(0);
}

seedProjects().catch((err) => {
  console.error("Error seeding projects:", err);
  process.exit(1);
});
