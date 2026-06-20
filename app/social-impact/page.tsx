"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthProvider";
import { Pencil, Trash2 } from "lucide-react";

type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  goalAmount?: number;
};

const PROJECT_ORDER = [
  "Education & Innovation",
  "Community Volunteering",
  "EV Charging Outreach",
  "Sustainability",
];

export default function SocialImpactPage() {
  const { claims } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  // Add project form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [goalAmount, setGoalAmount] = useState<number | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Inline edit state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editGoalAmount, setEditGoalAmount] = useState<number | "">("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      const snapshot = await getDocs(collection(db, "socialImpact"));
      const list = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Project)
      );
      list.sort(
        (a, b) => PROJECT_ORDER.indexOf(a.title) - PROJECT_ORDER.indexOf(b.title)
      );
      setProjects(list);
    };
    fetchProjects();
  }, []);

  const uploadImage = async (file: File) => {
    const storageRef = ref(storage, `projects/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return alert("Please upload an image");
    try {
      const imageUrl = await uploadImage(imageFile);
      await addDoc(collection(db, "socialImpact"), {
        title,
        description,
        category,
        goalAmount: goalAmount === "" ? null : Number(goalAmount),
        imageUrl,
      });
      alert("✅ Project added successfully!");
      setTitle(""); setDescription(""); setCategory(""); setGoalAmount(""); setImageFile(null);
      const snapshot = await getDocs(collection(db, "socialImpact"));
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Project));
      list.sort((a, b) => PROJECT_ORDER.indexOf(a.title) - PROJECT_ORDER.indexOf(b.title));
      setProjects(list);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add project");
    }
  };

  const toggleEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditTitle(project.title);
    setEditDescription(project.description);
    setEditCategory(project.category);
    setEditGoalAmount(project.goalAmount ?? "");
    setEditImageFile(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId) return;
    try {
      let imageUrl = projects.find((p) => p.id === editingProjectId)?.imageUrl;
      if (editImageFile) imageUrl = await uploadImage(editImageFile);
      await updateDoc(doc(db, "socialImpact", editingProjectId), {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        goalAmount: editGoalAmount === "" ? null : Number(editGoalAmount),
        imageUrl,
      });
      alert("✅ Project updated successfully!");
      setEditingProjectId(null);
      const snapshot = await getDocs(collection(db, "socialImpact"));
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Project));
      list.sort((a, b) => PROJECT_ORDER.indexOf(a.title) - PROJECT_ORDER.indexOf(b.title));
      setProjects(list);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update project");
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "socialImpact", projectId));
      alert("✅ Project deleted successfully.");
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("❌ Failed to delete project. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-white">🌍 Social Impact Projects</h1>

      {/* Admin form */}
      {claims?.admin && (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Title" className="w-full border p-2 rounded-md bg-black text-white border-gray-600 focus:ring-2 focus:ring-green-500" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <input type="text" placeholder="Category" className="w-full border p-2 rounded-md bg-black text-white border-gray-600 focus:ring-2 focus:ring-green-500" value={category} onChange={(e) => setCategory(e.target.value)} required />
            <input type="number" placeholder="Goal Amount (optional)" className="w-full border p-2 rounded-md bg-black text-white border-gray-600 focus:ring-2 focus:ring-green-500" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value === "" ? "" : Number(e.target.value))} />
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} required className="w-full border p-2 rounded-md border-gray-600 bg-black text-white" />
          </div>
          <textarea placeholder="Description" className="w-full border p-2 rounded-md mt-2 bg-black text-white border-gray-600 focus:ring-2 focus:ring-green-500" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">Add Project</button>
        </form>
      )}

      {/* Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-gray-900 rounded-2xl shadow-lg border border-gray-700 overflow-hidden group hover:shadow-2xl transition-shadow">
            {editingProjectId === project.id ? (
              <form onSubmit={handleEditSubmit} className="p-4 space-y-3">
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full border p-2 rounded-md bg-black text-white border-gray-600 focus:ring-2 focus:ring-blue-500" required />
                <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full border p-2 rounded-md bg-black text-white border-gray-600 focus:ring-2 focus:ring-blue-500" required />
                <input type="number" value={editGoalAmount} onChange={(e) => setEditGoalAmount(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border p-2 rounded-md bg-black text-white border-gray-600 focus:ring-2 focus:ring-blue-500" placeholder="Goal Amount (optional)" />
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full border p-2 rounded-md bg-black text-white border-gray-600 focus:ring-2 focus:ring-blue-500" required />
                <input type="file" accept="image/*" onChange={(e) => setEditImageFile(e.target.files?.[0] || null)} className="w-full border p-2 rounded-md border-gray-600 bg-black text-white" />
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Save</button>
                  <button type="button" onClick={() => setEditingProjectId(null)} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <Link href={`/social-impact/${project.id}`}>
                  <img src={project.imageUrl} alt={project.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                </Link>
                <div className="p-4">
                  <Link href={`/social-impact/${project.id}`}>
                    <h2 className="text-xl font-bold text-white hover:text-green-500 transition">{project.title}</h2>
                  </Link>
                  <p className="text-gray-300 mt-1 line-clamp-3">{project.description}</p>
                  <p className="text-sm text-gray-400 mt-1">Category: {project.category}</p>
                  {project.goalAmount && <p className="text-sm text-gray-200 font-medium mt-1">🎯 Goal: ${project.goalAmount.toLocaleString()}</p>}
                  {claims?.admin && (
                    <div className="flex gap-4 mt-3">
                      <button onClick={() => toggleEdit(project)} className="flex items-center gap-1 text-blue-400 hover:underline">
                        <Pencil size={16} /> Edit
                      </button>
                      <button onClick={() => handleDelete(project.id)} className="flex items-center gap-1 text-red-500 hover:underline">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
