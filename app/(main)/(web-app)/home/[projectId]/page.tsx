"use client";
import { useParams } from "next/navigation";

export default function ProjectDetailsPage() {
  const { projectId } = useParams();

  // TODO: Fetch and display project details using projectId

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Project Details</h1>
      <p>Project ID: <span className="font-mono">{projectId}</span></p>
      {/* Add more project details here */}
    </main>
  );
} 