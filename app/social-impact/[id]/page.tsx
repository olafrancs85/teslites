"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { Pencil, Trash2 } from "lucide-react";

// ----------------- Types -----------------
type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  goalAmount?: number;
};

type Donation = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  amount: number;
  currency: string;
  note?: string;
  createdAt: any;
};

// ----------------- Support Button -----------------
function SupportButton({ projectId, user }: { projectId: string; user: any }) {
  const [supported, setSupported] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supportsRef = collection(db, "socialImpact", projectId, "supports");
    const unsub = onSnapshot(supportsRef, (snap) => {
      setCount(snap.size);
      if (user) {
        setSupported(snap.docs.some((d) => d.id === user.uid));
      }
    });
    return () => unsub();
  }, [projectId, user]);

  const toggleSupport = async () => {
    if (!user) return alert("Login to support this project");

    const supportRef = doc(db, "socialImpact", projectId, "supports", user.uid);
    if (supported) {
      await deleteDoc(supportRef);
    } else {
      await setDoc(supportRef, { supportedAt: Date.now() });
    }
  };

  return (
    <button
      onClick={toggleSupport}
      className={`mt-4 px-4 py-2 rounded-lg text-white ${
        supported ? "bg-green-600" : "bg-blue-600"
      }`}
    >
      {supported ? "Supported" : "Support"} ({count})
    </button>
  );
}

// ----------------- Donation Form -----------------
function DonationForm({ projectId, user }: { projectId: string; user: any }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    if (!user) {
      alert("⚠️ Please login to donate.");
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      alert("Enter a valid donation amount");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "socialImpact", projectId, "donations"), {
        userId: user.uid,
        userName: user.displayName || user.email || "Anonymous",
        userAvatar: user.photoURL || null,
        amount: Number(amount),
        currency,
        note,
        createdAt: serverTimestamp(),
      });

      setAmount("");
      setNote("");
      alert("✅ Thank you for supporting this project!");
    } catch (err) {
      console.error("Donation error:", err);
      alert("❌ Failed to donate. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="mt-8 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Make a Donation</h3>
      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      >
        <option value="USD">🇺🇸 Dollar (USD)</option>
        <option value="NGN">🇳🇬 Naira (NGN)</option>
        <option value="GBP">🇬🇧 Pounds (GBP)</option>
        <option value="EUR">🇪🇺 Euro (EUR)</option>
        <option value="JPY">🇯🇵 Yen (JPY)</option>
        <option value="XOF">🌍 CFA Franc (XOF)</option>
      </select>
      <textarea
        placeholder="Leave a note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <button
        onClick={handleDonate}
        disabled={loading}
        className="w-full py-2 rounded-lg text-white bg-purple-600 hover:bg-purple-700"
      >
        {loading ? "Processing..." : "Donate"}
      </button>
    </div>
  );
}

// ----------------- Donation History + Progress -----------------
function DonationHistory({
  projectId,
  goalAmount,
  isAdmin,
}: {
  projectId: string;
  goalAmount?: number;
  isAdmin: boolean;
}) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [totalRaised, setTotalRaised] = useState(0);
  const [editingGoal, setEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(goalAmount?.toString() || "");

  useEffect(() => {
    const q = query(
      collection(db, "socialImpact", projectId, "donations"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setDonations(docs);
      setTotalRaised(docs.reduce((sum, d) => sum + (d.amount || 0), 0));
    });
    return () => unsub();
  }, [projectId]);

  const progress = goalAmount ? Math.min((totalRaised / goalAmount) * 100, 100) : 0;

  const updateGoal = async () => {
    if (!newGoal || isNaN(Number(newGoal))) return;
    await updateDoc(doc(db, "socialImpact", projectId), {
      goalAmount: Number(newGoal),
    });
    setEditingGoal(false);
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Recent Donations</h3>

      {goalAmount !== undefined && (
        <div className="mb-6">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="font-medium">
              Raised: ${totalRaised.toLocaleString()}
            </span>
            <span className="flex items-center gap-2 text-gray-600">
              Goal:{" "}
              {editingGoal ? (
                <>
                  <input
                    type="number"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="w-24 px-2 py-1 border rounded text-sm"
                  />
                  <button
                    onClick={updateGoal}
                    className="px-2 py-1 bg-green-600 text-white rounded"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  ${goalAmount.toLocaleString()}
                  {isAdmin && (
                    <Pencil
                      size={16}
                      className="cursor-pointer text-gray-500 hover:text-black"
                      onClick={() => setEditingGoal(true)}
                    />
                  )}
                </>
              )}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress.toFixed(1)}% funded
          </p>
        </div>
      )}

      {donations.length === 0 ? (
        <p className="text-gray-500">No donations yet. Be the first!</p>
      ) : (
        <ul className="space-y-3">
          {donations.map((donation) => (
            <li
              key={donation.id}
              className="p-3 border rounded-lg bg-white shadow-sm"
            >
              <p className="font-medium">
                {donation.userName} donated {donation.amount} {donation.currency}
              </p>
              {donation.note && (
                <p className="text-gray-600 mt-1">💬 "{donation.note}"</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {donation.createdAt?.toDate
                  ? donation.createdAt.toDate().toLocaleString()
                  : "Just now"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ----------------- Main Project Detail -----------------
export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, claims } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Form state for editing
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      const ref = doc(db, "socialImpact", id as string);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as any;
        const proj = {
          id: snap.id,
          title: data.title,
          description: data.description,
          category: data.category,
          imageUrl: data.imageUrl,
          goalAmount: data.goalAmount,
        };
        setProject(proj);
        // preload form
        setTitle(proj.title);
        setDescription(proj.description);
        setCategory(proj.category);
        setGoalAmount(proj.goalAmount?.toString() || "");
      }
      setLoading(false);
    };
    fetchProject();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    try {
      let imageUrl = project.imageUrl;

      if (imageFile) {
        const storageRef = ref(storage, `socialImpact/${Date.now()}-${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "socialImpact", project.id), {
        title,
        description,
        category,
        goalAmount: goalAmount ? Number(goalAmount) : null,
        imageUrl,
      });

      setProject({
        ...project,
        title,
        description,
        category,
        goalAmount: goalAmount ? Number(goalAmount) : undefined,
        imageUrl,
      });

      setEditing(false);
    } catch (err) {
      console.error("Error updating project:", err);
      alert("❌ Failed to update project.");
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    const confirmDelete = confirm(
      `Are you sure you want to delete "${project.title}"? This cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "socialImpact", project.id));
      alert("✅ Project deleted successfully.");
      router.push("/social-impact");
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("❌ Failed to delete project.");
    }
  };

  if (loading) return <p className="p-6 text-center text-gray-400">Loading project...</p>;
  if (!project) return <p className="p-6 text-center text-red-500">Project not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6 flex justify-between">
        <Link
          href="/social-impact"
          className="inline-block px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
        >
          ← Back to Projects
        </Link>
        {claims?.admin && !editing && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center gap-1"
            >
              <Pencil size={16} /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="rounded-2xl shadow-lg overflow-hidden bg-white text-gray-900">
          <Image
            src={project.imageUrl || "/images/placeholder.jpg"}
            alt={project.title}
            width={800}
            height={400}
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
            {project.category && (
              <p className="text-sm text-gray-500 mb-4">{project.category}</p>
            )}
            <p className="text-lg text-gray-800 mb-6">{project.description}</p>

            <SupportButton projectId={project.id} user={user} />
            <DonationForm projectId={project.id} user={user} />
            <DonationHistory
              projectId={project.id}
              goalAmount={project.goalAmount}
              isAdmin={!!claims?.admin}
            />
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleUpdate}
          className="bg-white text-gray-900 p-6 rounded-2xl shadow space-y-4"
        >
          <h2 className="text-xl font-semibold">Edit Project</h2>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full p-2 border rounded"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            placeholder="Goal Amount"
            className="w-full p-2 border rounded"
          />
          <input
            type="file"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
