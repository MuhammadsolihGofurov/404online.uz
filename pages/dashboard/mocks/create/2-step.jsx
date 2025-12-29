import React, { useState, useEffect } from "react";
import { withAuthGuard } from "@/components/guard/dashboard-guard";
import { DashboardLayout } from "@/components/layout";
import Seo from "@/components/seo/Seo";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import { ButtonSpinner } from "@/components/custom/loading";
import { Input, FileInput } from "@/components/custom/details";
import Select from "@/components/custom/details/select";
import { READING_TYPES } from "@/mock/data"; // Assuming this exists
import { MOCK_ENDPOINTS } from "@/utils/mock-api";

function Step2Details({ user, loading }) {
    const router = useRouter();
    const { mock_type } = router.query;
    const [reqLoading, setReqLoading] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            title: "",
            duration: 40,
            mock_type: mock_type || "",
        },
    });

    useEffect(() => {
        if (!mock_type && router.isReady) {
            router.push("/dashboard/mocks/create/index");
        } else {
            setValue("mock_type", mock_type);
        }
    }, [mock_type, router.isReady]);

    const onSubmit = async (data) => {
        try {
            setReqLoading(true);

            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("duration", `00:${data.duration}:00`);
            formData.append("mock_type", data.mock_type);

            // Reading specific
            if (data.mock_type === "READING") {
                formData.append("reading_type", data.reading_type);
            }
            // Listening specific
            if (data.mock_type === "LISTENING" && data.audio_file) {
                formData.append("audio_file", data.audio_file);
            }

            const endpoint = MOCK_ENDPOINTS[data.mock_type]?.ROOT;
            if (!endpoint) throw new Error("Invalid Type");

            const res = await authAxios.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Success -> Go to Step 3 (Editor)
            router.push(`/dashboard/mocks/create/3-step?mock_id=${res.data.id}&mock_type=${data.mock_type}`);

        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.detail || "Failed to create mock");
        } finally {
            setReqLoading(false);
        }
    };

    if (!mock_type) return null;

    return (
        <>
            <Seo title={`Create ${mock_type} Mock`} />
            <DashboardLayout user={user} loading={loading}>
                <div className="max-w-3xl mx-auto">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
                        <ArrowLeft size={18} />
                        <span>Back</span>
                    </button>

                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm animate-fadeIn">
                        <div className="border-b border-gray-100 pb-6 mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Mock Details</h1>
                            <p className="text-gray-500 mt-1">Configure the basic settings for your <span className="font-semibold text-indigo-600">{mock_type}</span> assessment.</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <Input
                                        register={register}
                                        name="title"
                                        title="Exam Title"
                                        placeholder="e.g. IELTS Listening Practice 5"
                                        required
                                        error={errors.title?.message}
                                        validation={{ required: "Title is required" }}
                                    />
                                </div>

                                <div>
                                    <Input
                                        type="number"
                                        register={register}
                                        name="duration"
                                        title="Duration (minutes)"
                                        placeholder="40"
                                        required
                                        error={errors.duration?.message}
                                        validation={{ required: "Duration is required", min: 1 }}
                                    />
                                </div>

                                {mock_type === "READING" && (
                                    <Controller
                                        name="reading_type"
                                        control={control}
                                        rules={{ required: "Reading Type is required" }}
                                        render={({ field }) => (
                                            <Select
                                                {...field}
                                                title="Reading Type"
                                                options={READING_TYPES}
                                                placeholder="Select Type"
                                                error={errors.reading_type?.message}
                                            />
                                        )}
                                    />
                                )}

                                {mock_type === "LISTENING" && (
                                    <div className="md:col-span-2">
                                        <FileInput
                                            control={control}
                                            name="audio_file"
                                            label="Main Audio File"
                                            accept="audio/*"
                                            errors={errors}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Upload the full exam audio here. Max 50MB.</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={reqLoading}
                                    className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {reqLoading && <ButtonSpinner />}
                                    Continue to Sections
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </DashboardLayout>
        </>
    );
}

export default withAuthGuard(Step2Details, ["CENTER_ADMIN", "TEACHER", "ASSISTANT"]);
