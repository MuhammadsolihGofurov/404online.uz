"use client";
import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { PlusCircleIcon, SaveIcon } from "lucide-react";
import { Input, Alerts } from "@/components/custom/details";
import { ButtonSpinner } from "@/components/custom/loading";
import { authAxios } from "@/utils/axios";
import QuestionItem from "./quiz/question-item";
import { SECTIONS_URL } from "@/mock/router";

export default function QuizCreator() {
  const router = useRouter();
  const { id, type } = router.query; // type=edit params orqali
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    unregister,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      default_duration_minutes: 10,
      content: [{ q: "", options: ["", ""], correct: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "content",
  });

  // Edit Mode: Ma'lumotlarni olish
  useEffect(() => {
    if (type === "edit" && id) {
      const fetchQuiz = async () => {
        try {
          const res = await authAxios.get(`/quizzes/${id}/`);
          reset(res.data);
        } catch (err) {
          toast.error("Failed to load quiz data");
        }
      };
      fetchQuiz();
    }
  }, [id, type, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formattedData = {
        ...data,
        content: data.content.map((item) => ({
          ...item,
          // correct qiymatini aniq son ekanligiga ishonch hosil qilish
          correct: parseInt(item.correct, 10),
        })),
      };
      const url = type === "edit" ? `/quizzes/${id}/` : "/quizzes/";
      const method = type === "edit" ? "put" : "post";

      await authAxios[method](url, formattedData);
      toast.success("Quiz saved successfully!");
      router.push(SECTIONS_URL + "?section=quiz");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full">
        {/* Header Section */}
        <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-5">
          <h2 className="text-2xl font-bold text-slate-800">
            {type === "edit" ? "Edit Quiz" : "Create New Quiz"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              title="Quiz Title"
              register={register}
              name="title"
              required
              error={errors.title?.message}
            />
            <Input
              title="Duration (Minutes)"
              type="number"
              register={register}
              name="default_duration_minutes"
            />
          </div>
          <Input
            title="Description"
            register={register}
            name="description"
            placeholder="Briefly describe this quiz..."
          />
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-slate-700">Questions</h3>
            <button
              type="button"
              onClick={() => append({ q: "", options: ["", ""], correct: 0 })}
              className="bg-main/10 text-main hover:bg-main hover:text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-medium"
            >
              <PlusCircleIcon size={20} /> Add Question
            </button>
          </div>

          {fields.map((field, index) => (
            <QuestionItem
              key={field.id}
              qIndex={index}
              register={register}
              control={control}
              errors={errors}
              watch={watch}
              unregister={remove} // useFieldArray remove ishlatish tavsiya etiladi
            />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-main text-white px-10 py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-3 font-bold text-sm"
          >
            {loading ? <ButtonSpinner /> : <SaveIcon size={16} />}
            {type === "edit" ? "Update Quiz" : "Save Quiz"}
          </button>
        </div>
      </form>
    </div>
  );
}
