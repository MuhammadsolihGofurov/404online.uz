import React, { useState } from "react";
import { Tab } from "@headlessui/react";
import { Save, Plus, Trash2, Upload, FileAudio, PlayCircle } from "lucide-react";
import { authAxios } from "@/utils/axios";
import { MOCK_ENDPOINTS, getEditorEndpoints } from "@/utils/mock-api";
import { toast } from "react-toastify";
import { ButtonSpinner } from "@/components/custom/loading";
import { FileInput } from "@/components/custom/details";
import { useForm } from "react-hook-form";

// Sub-components (will create these inline or separate if complex)
import ListeningPartEditor from "./listening/part-editor";

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

export default function ListeningEditor({ mock, refresh }) {
    const [uploading, setUploading] = useState(false);
    const [activePartIndex, setActivePartIndex] = useState(0);

    // Audio Upload Handler
    const handleAudioUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("audio_file", file);

            const endpoint = MOCK_ENDPOINTS.LISTENING.DETAIL(mock.id);
            await authAxios.patch(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast.success("Audio uploaded successfully");
            if (refresh) await refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload audio");
        } finally {
            setUploading(false);
        }
    };

    // Sort parts by number (just in case)
    const sortedParts = mock.parts?.sort((a, b) => a.part_number - b.part_number) || [];

    return (
        <div className="space-y-6">
            {/* Header / Meta */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{mock.title}</h1>
                        <p className="text-gray-500 text-sm">Listening Mock • {mock.duration} minutes</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* <span className={`px-3 py-1 rounded-full text-xs font-semibold ${mock.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {mock.status}
                        </span> */}
                    </div>
                </div>

                {/* Main Audio File */}
                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileAudio size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">Main Audio Track</h3>
                            {mock.audio_file ? (
                                <a href={mock.audio_file} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                                    <PlayCircle size={14} />
                                    Play Current Audio
                                </a>
                            ) : (
                                <p className="text-sm text-gray-400">No audio file uploaded yet</p>
                            )}
                        </div>
                        <label className="cursor-pointer">
                            <input type="file" className="hidden" accept="audio/*" onChange={handleAudioUpload} disabled={uploading} />
                            <div className={`px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2 shadow-sm ${uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                                {uploading ? <ButtonSpinner dark /> : <Upload size={16} />}
                                {mock.audio_file ? "Replace Audio" : "Upload Audio"}
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Parts Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px]">
                <Tab.Group selectedIndex={activePartIndex} onChange={setActivePartIndex}>
                    <div className="border-b border-gray-100 bg-gray-50/50 px-6 pt-4">
                        <Tab.List className="flex space-x-1">
                            {sortedParts.map((part) => (
                                <Tab
                                    key={part.id}
                                    className={({ selected }) =>
                                        classNames(
                                            "w-32 py-2.5 text-sm font-medium leading-5 rounded-t-lg transition-all focus:outline-none",
                                            selected
                                                ? "bg-white text-indigo-600 border-x border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] translate-y-[1px]"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                                        )
                                    }
                                >
                                    Part {part.part_number}
                                </Tab>
                            ))}
                        </Tab.List>
                    </div>

                    <Tab.Panels className="p-6">
                        {sortedParts.map((part) => (
                            <Tab.Panel key={part.id} className="animate-fadeIn focus:outline-none">
                                <ListeningPartEditor part={part} refresh={refresh} />
                            </Tab.Panel>
                        ))}
                    </Tab.Panels>
                </Tab.Group>
            </div>
        </div>
    );
}
