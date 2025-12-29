import React, { useState } from "react";
import { Plus, Trash2, Edit2, GripVertical, Image as ImageIcon } from "lucide-react";
import { authAxios } from "@/utils/axios";
import { getEditorEndpoints } from "@/utils/mock-api";
import { toast } from "react-toastify";
import QuestionGroupModal from "./question-group-modal";

export default function ListeningPartEditor({ part, refresh }) {
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    const endpoints = getEditorEndpoints("LISTENING");

    const handleDeleteGroup = async (groupId) => {
        if (!confirm("Are you sure? This will delete all questions in this group.")) return;
        try {
            await authAxios.delete(endpoints.group(groupId));
            toast.success("Group deleted");
            refresh();
        } catch (error) {
            toast.error("Failed to delete group");
        }
    };

    const handleEditGroup = (group) => {
        setEditingGroup(group);
        setIsGroupModalOpen(true);
    };

    const handleAddGroup = () => {
        setEditingGroup(null);
        setIsGroupModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Part {part.part_number} Content</h3>
                    <p className="text-sm text-gray-500">Manage question groups and questions for this part.</p>
                </div>
                <button
                    onClick={handleAddGroup}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                >
                    <Plus size={16} />
                    Add Question Group
                </button>
            </div>

            {part.question_groups?.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <p className="text-gray-400 mb-4">No questions yet in this part.</p>
                    <button onClick={handleAddGroup} className="text-indigo-600 font-medium hover:underline">
                        Create your first question group
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {part.question_groups?.map((group, idx) => (
                        <div key={group.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
                            {/* Group Header */}
                            <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-1.5 rounded border border-gray-200 text-gray-400">
                                        <GripVertical size={14} />
                                    </div>
                                    <span className="font-semibold text-gray-900 text-sm">{group.question_type}</span>
                                    {group.image && <ImageIcon size={14} className="text-gray-400" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEditGroup(group)}
                                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGroup(group.id)}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Group Content Preview */}
                            <div className="p-4">
                                <p className="text-sm text-gray-600 font-medium mb-3 italic">&quot;{group.instruction}&quot;</p>
                                <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                                    {group.questions?.map((q) => (
                                        <div key={q.id} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="font-bold min-w-[24px]">{q.question_number}.</span>
                                            <div dangerouslySetInnerHTML={{ __html: q.text || '(No text)' }} className="opacity-80 line-clamp-1" />
                                        </div>
                                    ))}
                                    {group.questions?.length === 0 && (
                                        <span className="text-xs text-red-400">No questions in this group</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Add/Edit Group */}
            <QuestionGroupModal
                isOpen={isGroupModalOpen}
                closeModal={() => setIsGroupModalOpen(false)}
                group={editingGroup}
                partId={part.id}
                refresh={refresh}
                type="LISTENING"
            />
        </div>
    );
}
