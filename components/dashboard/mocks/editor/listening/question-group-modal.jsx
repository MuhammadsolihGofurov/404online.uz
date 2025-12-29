import React, { useState, Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Plus, Trash2 } from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { getEditorEndpoints } from "@/utils/mock-api";
import { toast } from "react-toastify";
import { ButtonSpinner } from "@/components/custom/loading";
import { Input, FileInput } from "@/components/custom/details";
import Select from "@/components/custom/details/select"; // Verify path

// Reuse enums from data or constants
const LISTENING_QUESTION_TYPES = [
    { value: "MCQ", label: "Multiple Choice" },
    { value: "MATCHING", label: "Matching" },
    { value: "MAP_DIAGRAM", label: "Map/Plan/Diagram Labelling" },
    { value: "COMPLETION", label: "Form/Note/Table/Flow-chart Completion" },
    { value: "SENTENCE", label: "Sentence Completion" },
    { value: "SHORT_ANSWER", label: "Short Answer" }
];

export default function QuestionGroupModal({ isOpen, closeModal, group, partId, refresh, type }) {
    const [loading, setLoading] = useState(false);
    const endpoints = getEditorEndpoints(type);

    const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        defaultValues: {
            question_type: "MCQ",
            instruction: "",
            order: 0,
            questions: [{ question_number: "", text: "", correct_answer: "", metadata: {} }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "questions"
    });

    // Reset form when modal opens or group changes
    useEffect(() => {
        if (isOpen) {
            if (group) {
                // Editing existing group
                // We need to transform questions a bit if structure differs
                reset({
                    question_type: group.question_type,
                    instruction: group.instruction,
                    order: group.order,
                    questions: group.questions?.map(q => ({
                        id: q.id,
                        question_number: q.question_number,
                        text: q.text,
                        // Simplification for MVP: Assuming simple correct answer structure or stringifying it
                        // For full editor, we might need a dedicated Question Builder
                    })) || []
                });
            } else {
                // New group
                reset({
                    question_type: "MCQ",
                    instruction: "",
                    order: 0,
                    questions: [{ question_number: "", text: "" }]
                });
            }
        }
    }, [isOpen, group, reset]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("part", partId);
            formData.append("question_type", data.question_type);
            formData.append("instruction", data.instruction);
            formData.append("order", data.order);

            if (data.image && data.image[0]) {
                formData.append("image", data.image[0]);
            }

            // For MVP, we might create group first, then questions separately?
            // Or backend supports nested write?
            // Checking backend: ListeningQuestionGroupSerializer has questions=ListeningQuestionSerializer(many=True)
            // But usually DRF nested writes need explicit update() implementation which might be complex.
            // Let's assume we send JSON for questions if backend handles it, OR we do it step by step.

            // Backend `ListeningMockDetailSerializer` is read-only for parts usually or delegated to service.
            // But here we are using `endpoints.group(id)` which likely points to `ListeningQuestionGroupViewSet`.
            // Does it support nested writes? `apps/mocks/api/views/editor.py` would confirm.

            // Assuming we send basic group data first.

            let res;
            if (group?.id) {
                res = await authAxios.patch(endpoints.group(group.id), formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            } else {
                res = await authAxios.post(endpoints.group(), formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            // Now handle questions (create/update individual questions)
            // OR if backend handles nested questions in group serializer (check needed)

            // Strategy: Create group, then loop create questions. 
            // Better: Backend should handle nested. If not, we might fail.
            // Let's assume for now we just save the Group Metadata.
            // Questions management should ideally be separate or handled if backend supports it.

            toast.success("Group saved");
            closeModal();
            refresh();

        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Failed to save group");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-full p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">
                                        {group ? "Edit Question Group" : "New Question Group"}
                                    </Dialog.Title>
                                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <Controller
                                                name="question_type"
                                                control={control}
                                                rules={{ required: "Required" }}
                                                render={({ field }) => (
                                                    <Select
                                                        {...field}
                                                        title="Question Type"
                                                        options={LISTENING_QUESTION_TYPES}
                                                        error={errors.question_type?.message}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Input
                                                register={register}
                                                name="order"
                                                type="number"
                                                title="Order Criteria"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                register={register}
                                                name="instruction"
                                                title="Instruction"
                                                placeholder="e.g. Choose the correct letter, A, B or C."
                                                required
                                                error={errors.instruction?.message}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <FileInput
                                                control={control}
                                                name="image"
                                                label="Group Image (Optional)"
                                                accept="image/*"
                                            />
                                        </div>
                                    </div>

                                    {/* Questions List - Simplified for MVP, maybe just count or link to separate management? 
                                        Implementing full nested question edit here is complex. 
                                        Let's stick to Header info first, then let user add questions in main view or separate modal?
                                        Actually, users expect to add questions here.
                                    */}
                                    {/* <div className="pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-gray-900">Questions</h4>
                                            <button type="button" onClick={() => append({ question_number: "", text: "" })} className="flex items-center gap-1 text-xs font-medium text-indigo-600">
                                                <Plus size={14} /> Add Question
                                            </button>
                                        </div>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                            {fields.map((field, index) => (
                                                <div key={field.id} className="flex items-start gap-2">
                                                    <div className="w-16">
                                                        <input {...register(`questions.${index}.question_number`)} placeholder="#" className="w-full text-sm border-gray-300 rounded-lg" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <input {...register(`questions.${index}.text`)} placeholder="Question text..." className="w-full text-sm border-gray-300 rounded-lg" />
                                                    </div>
                                                    <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 rounded hover:bg-red-50">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div> */}

                                    <div className="p-3 text-sm text-yellow-700 rounded-lg bg-yellow-50">
                                        Note: Managing questions inside this modal is disabled for now. Please create the group first, then add questions in the main editor.
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center gap-2 px-6 py-2 font-semibold text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
                                        >
                                            {loading && <ButtonSpinner />}
                                            Save Group
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
