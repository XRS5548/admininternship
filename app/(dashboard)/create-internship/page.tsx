"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateInternshipPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    domain: "",
    duration: "1 Month",
    shortDescription: "",
    fullDescription: "",
    skills: "",
    eligibility: "",
    totalTasks: 0,
    weeklyCommitment: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);

    const res = await fetch("/api/internships/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()),
        mode: "Virtual",
        mentorship: true,
        perks: ["Certificate"],
      }),
    });

    setLoading(false);

    if (res.ok) {
      alert("Internship Created ✅");
      setForm({
        title: "",
        domain: "",
        duration: "1 Month",
        shortDescription: "",
        fullDescription: "",
        skills: "",
        eligibility: "",
        totalTasks: 0,
        weeklyCommitment: "",
      });
    } else {
      alert("Error creating internship ❌");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create Internship</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            name="title"
            placeholder="Internship Title"
            value={form.title}
            onChange={handleChange}
          />

          <Input
            name="domain"
            placeholder="Domain (Web / App / AI)"
            value={form.domain}
            onChange={handleChange}
          />

          <Input
            name="duration"
            placeholder="Duration (1 Month)"
            value={form.duration}
            onChange={handleChange}
          />

          <Textarea
            name="shortDescription"
            placeholder="Short Description"
            value={form.shortDescription}
            onChange={handleChange}
          />

          <Textarea
            name="fullDescription"
            placeholder="Full Description"
            value={form.fullDescription}
            onChange={handleChange}
          />

          <Input
            name="skills"
            placeholder="Skills (comma separated)"
            value={form.skills}
            onChange={handleChange}
          />

          <Input
            name="eligibility"
            placeholder="Eligibility"
            value={form.eligibility}
            onChange={handleChange}
          />

          <Input
            name="totalTasks"
            type="number"
            placeholder="Total Tasks"
            value={form.totalTasks}
            onChange={handleChange}
          />

          <Input
            name="weeklyCommitment"
            placeholder="Weekly Commitment (5–6 hrs)"
            value={form.weeklyCommitment}
            onChange={handleChange}
          />

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Internship"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
