"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthProvider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";

type Reward = {
  id: string;
  name: string;
  category: string;
  month: string;
};

// Helper: Get current month in "Month YYYY" format
const getCurrentMonth = () => {
  const now = new Date();
  return now.toLocaleString("default", { month: "long", year: "numeric" });
};

export default function RewardsPage() {
  const { claims } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);

  // New reward form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [month] = useState(getCurrentMonth()); // fixed, read-only

  // Edit state
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editMonth, setEditMonth] = useState("");

  // Fetch rewards
  useEffect(() => {
    const fetchRewards = async () => {
      const snapshot = await getDocs(collection(db, "rewards"));
      const list = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Reward)
      );
      setRewards(list);
    };
    fetchRewards();
  }, []);

  // Add reward
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "rewards"), { name, category, month });
      setName("");
      setCategory("");

      const snapshot = await getDocs(collection(db, "rewards"));
      setRewards(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Reward))
      );
    } catch (err) {
      console.error("Error adding reward:", err);
      alert("❌ Failed to add reward. Check console for details.");
    }
  };

  // Start editing
  const toggleEdit = (reward: Reward) => {
    setEditingRewardId(reward.id);
    setEditName(reward.name);
    setEditCategory(reward.category);
    setEditMonth(reward.month);
  };

  // Save edits
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRewardId) return;

    try {
      await updateDoc(doc(db, "rewards", editingRewardId), {
        name: editName,
        category: editCategory,
        // If left empty, auto-fill with current month
        month: editMonth.trim() || getCurrentMonth(),
      });

      setEditingRewardId(null);

      const snapshot = await getDocs(collection(db, "rewards"));
      setRewards(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Reward))
      );
    } catch (err) {
      console.error("Error updating reward:", err);
      alert("❌ Failed to update reward. Check console for details.");
    }
  };

  // Delete reward
  const handleDelete = async (rewardId: string) => {
    if (!confirm("Delete this reward?")) return;
    try {
      await deleteDoc(doc(db, "rewards", rewardId));
      setRewards((prev) => prev.filter((r) => r.id !== rewardId));
    } catch (error) {
      console.error("Error deleting reward:", error);
      alert("❌ Failed to delete reward. Check console for details.");
    }
  };

  // Group rewards by month
  const groupedRewards = rewards.reduce((acc, reward) => {
    if (!acc[reward.month]) acc[reward.month] = [];
    acc[reward.month].push(reward);
    return acc;
  }, {} as Record<string, Reward[]>);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-red-600 mb-6 text-center">
        🚀 Rewards
      </h1>
      <p className="text-center text-gray-300 mb-10">
        See monthly winners and discover how to earn rewards.
      </p>

      {/* Admin form */}
      {claims?.admin && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 max-w-3xl mx-auto bg-gray-900 p-6 rounded-2xl border border-gray-700"
        >
          <h2 className="text-xl font-semibold mb-4 text-green-400">
            ➕ Add Reward
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Winner Name"
              className="w-full border p-2 rounded-md bg-black text-white border-gray-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Category"
              className="w-full border p-2 rounded-md bg-black text-white border-gray-600"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            <input
              type="text"
              className="w-full border p-2 rounded-md bg-black text-white border-gray-600"
              value={month}
              readOnly
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Add
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Monthly Winners */}
        <Card className="bg-gray-900 border border-gray-700 text-white rounded-2xl shadow-lg col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-green-400">
              🏆 Monthly Winners
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.keys(groupedRewards).map((month) => (
              <div key={month}>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                  {month}
                </h3>
                <div className="space-y-3">
                  {groupedRewards[month].map((reward) =>
                    editingRewardId === reward.id ? (
                      <form
                        key={reward.id}
                        onSubmit={handleEditSubmit}
                        className="p-3 bg-black rounded-lg border border-gray-700 space-y-2"
                      >
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border p-2 rounded-md bg-black text-white border-gray-600"
                          required
                        />
                        <input
                          type="text"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full border p-2 rounded-md bg-black text-white border-gray-600"
                          required
                        />
                        <input
                          type="text"
                          value={editMonth}
                          onChange={(e) => setEditMonth(e.target.value)}
                          className="w-full border p-2 rounded-md bg-black text-white border-gray-600"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-blue-600 px-3 py-1 rounded-md"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRewardId(null)}
                            className="bg-gray-600 px-3 py-1 rounded-md"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div
                        key={reward.id}
                        className="p-3 bg-black rounded-lg border border-gray-700 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold">{reward.name}</p>
                          <p className="text-sm text-gray-400">
                            {reward.category}
                          </p>
                          <p className="text-xs text-gray-500">{reward.month}</p>
                        </div>
                        {claims?.admin && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => toggleEdit(reward)}
                              className="text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <Pencil size={16} /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(reward.id)}
                              className="text-red-500 hover:underline flex items-center gap-1"
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* How to Earn Rewards */}
        <Card className="bg-gray-900 border border-gray-700 text-white rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-400">
              💡 How to Earn Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-300">
            <p>• Sell items in the Marketplace to earn points.</p>
            <p>• Post valuable content in the Community.</p>
            <p>• Contribute to Social Impact projects.</p>
            <p>• Stay consistent to climb the monthly leaderboard.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
