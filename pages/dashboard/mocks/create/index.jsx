import React, { useState } from "react";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { Headphones, BookOpen, PenTool, ArrowRight } from "lucide-react";
import { useRouter } from "next/router";

function CreateMockPage({ user, loading }) {
    const router = useRouter();

    const mockTypes = [
        {
            id: "LISTENING",
            title: "Listening Mock",
            description: "Create a listening assessment with audio tracks and questions.",
            icon: Headphones,
            color: "blue",
        },
        {
            id: "READING",
            title: "Reading Mock",
            description: "Create a reading assessment with passages and question groups.",
            icon: BookOpen,
            color: "emerald",
        },
        {
            id: "WRITING",
            title: "Writing Mock",
            description: "Create a writing assessment with task prompts.",
            icon: PenTool,
            color: "amber",
        },
    ];

    const handleSelect = (type) => {
        // Navigate to Step 2 (Details) with type param
        router.push(`/dashboard/mocks/create/2-step?mock_type=${type}`);
    };

    return (
        <>
            <Seo title="Create Mock" />
            <DashboardLayout user={user} loading={loading}>
                <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900">Choose Mock Type</h1>
                        <p className="text-gray-500 max-w-lg mx-auto">Select the type of assessment you want to create. This will determine the structure and options available.</p>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                        {mockTypes.map((type) => (
                            <div
                                key={type.id}
                                onClick={() => handleSelect(type.id)}
                                className={`
                            group relative bg-white rounded-2xl p-6 border-2 border-gray-100 
                            hover:border-${type.color}-200 hover:shadow-xl hover:shadow-${type.color}-50/50 
                            cursor-pointer transition-all duration-300 hover:-translate-y-1
                        `}
                            >
                                <div className={`
                            w-14 h-14 rounded-full flex items-center justify-center mb-6
                            bg-${type.color}-50 text-${type.color}-500 group-hover:scale-110 transition-transform
                        `}>
                                    <type.icon size={28} />
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                    {type.title}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                    {type.description}
                                </p>

                                <div className="flex items-center text-sm font-semibold text-gray-400 group-hover:text-indigo-600 transition-colors">
                                    <span>Get Started</span>
                                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        </>
    );
}

export default withAuthGuard(CreateMockPage, ["CENTER_ADMIN", "TEACHER", "ASSISTANT"]);
