import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useParams } from "@/hooks/useParams";
import { useOffcanvas } from "@/context/offcanvas-context";
import { authAxios } from "@/utils/axios";

// Components
import { ButtonSpinner } from "../../loading";
import { McqQuestionForm, FormCompletionForm, MapDiagramForm } from "./types";
import {
  generateQuestionPayload,
  parseInitialTokens,
} from "@/utils/question-helpers";
import { Input, SmartTextarea, Textarea } from "../../details";

// Helpers

export default function QuestionOffcanvas({ id, initialData }) {
  const { closeOffcanvas } = useOffcanvas();
  const { findParams } = useParams();
  const [reqLoading, setReqLoading] = useState(false);

  const sectionType = findParams("section") || "listening";
  const groupId = findParams("groupId") || "";
  const questionType = findParams("questionType") || initialData?.question_type;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      question_number: initialData?.question_number || 1,
      text: initialData?.text || "",
      tokens: initialData ? parseInitialTokens(initialData) : [],
      mcq_display_type: initialData?.metadata?.gap_1?.display || "radio",
      mcq_options: initialData?.metadata?.gap_1?.options?.map((o) => ({
        text: o.text,
      })) || [{ text: "" }, { text: "" }, { text: "" }],
      correct_answer_mcq:
        initialData?.correct_answer?.gap_1?.map((letter) => ({
          id: letter,
          title: `Option ${letter}`,
        })) || [],
    },
  });

  const watchText = watch("text");

  // Token auto-detect logic (MCQ bo'lmagan barcha turlar uchun)
  useEffect(() => {
    if (questionType !== "MCQ") {
      const matches = [...watchText.matchAll(/{{(.*?)}}/g)].map((m) => m[1]);
      const currentTokens = watch("tokens") || [];

      const updatedTokens = matches.map((tName) => {
        const existing = currentTokens.find((t) => t.id === tName);
        if (existing) return existing;

        return {
          id: tName,
          answers: "",
          available_zones: "A, B, C, D, E, F, G, H, I", // Default variantlar
          type: questionType === "MAP_DIAGRAM" ? "zone_select" : "text_input",
        };
      });

      const currentIds = currentTokens.map((t) => t.id).join(",");
      const matchedIds = matches.join(",");

      if (currentIds !== matchedIds) {
        setValue("tokens", updatedTokens);
      }
    }
  }, [watchText, questionType, setValue]);

  const submitFn = async (values) => {
    try {
      setReqLoading(true);
      const payload = generateQuestionPayload(questionType, values, groupId);

      const url = `/editor/${sectionType}-questions/${id ? id + "/" : ""}`;
      const method = id ? "patch" : "post";

      const res = await authAxios({ method, url, data: payload });
      toast.success("Saved successfully!");
      closeOffcanvas("questionOffcanvas", res.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Error occurred");
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-1">
      <h2 className="text-xl font-bold border-b pb-4 uppercase">
        {questionType.replace("_", " ")} - {id ? "Edit" : "Create"}
      </h2>

      <form onSubmit={handleSubmit(submitFn)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <div className="w-24">
            <Input
              type="number"
              name="question_number"
              title="No"
              register={register}
              required
            />
          </div>

          {/* Input o'rniga Textarea ishlatamiz */}
          {/* <Textarea
            name="text"
            title="Question Text / Instruction"
            placeholder={
              questionType === "MCQ"
                ? "Enter the question stem here..."
                : "Enter text. Use {{gap_1}}, {{gap_2}} for gaps."
            }
            register={register}
            required
          /> */}
          <SmartTextarea
            name="text"
            title="Question Content"
            register={register}
            watch={watch}
            placeholder={
              questionType === "MCQ"
                ? "Enter the question stem here..."
                : "Enter text. Use {{gap_1}}, {{gap_2}} for gaps."
            }
            setValue={setValue}
            questionType={questionType}
          />
        </div>

        {/* DINAMIK COMPONENTLAR */}
        {questionType === "MCQ" && (
          <McqQuestionForm
            register={register}
            control={control}
            watch={watch}
            setValue={setValue}
          />
        )}

        {/* MAP_DIAGRAM UCHUN */}
        {questionType === "MAP_DIAGRAM" && (
          <MapDiagramForm register={register} control={control} watch={watch} />
        )}

        {(questionType === "COMPLETION" ||
          questionType === "SENTENCE_COMPLETION") && (
          <FormCompletionForm
            register={register}
            control={control}
            watch={watch}
          />
        )}

        <button
          type="submit"
          disabled={reqLoading}
          className="w-full bg-main text-white p-4 rounded-xl font-bold flex justify-center"
        >
          {reqLoading ? <ButtonSpinner /> : "Save Question"}
        </button>
      </form>
    </div>
  );
}
