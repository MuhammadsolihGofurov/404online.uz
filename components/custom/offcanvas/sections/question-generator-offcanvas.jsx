import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "@/hooks/useParams";
import { useOffcanvas } from "@/context/offcanvas-context";
import { FileInput, Input, RichTextEditor, Select } from "../../details";
import { Controller, useForm } from "react-hook-form";
import { authAxios } from "@/utils/axios";
import { toast } from "react-toastify";
import { filterQuestionTypes, QUESTION_TYPES_WITH_IMAGE } from "@/mock/data";
import { ButtonSpinner } from "../../loading";
import { CompletionQGenerator } from "./generators/completion-q-generator";
import { prepareInitialData } from "@/utils/question-helpers";
import { GeminiScanner } from "./generators/gemini-scanner";

export default function QuestionGeneratorOffcanvas({ id, initialData }) {
  const { closeOffcanvas } = useOffcanvas();
  const generatorRef = useRef(null);
  const { findParams } = useParams();
  const [reqLoading, setReqLoading] = useState(false);

  const sectionType = findParams("section") || "listening";
  const groupId = findParams("groupId") || "";
  const questionType = findParams("questionType") || initialData?.question_type;
  const partId = findParams("partId") || "";
  const passageId = findParams("partId") || "";
  const partNumber = findParams("partNumber") || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      instruction: initialData?.instruction || "",
      question_type:
        initialData?.question_type || initialData?.group_type || "",
      image: initialData?.image || "",
      order: initialData?.order || 1,
      // Yangi maydonlar
      text_content: initialData?.text_content || "",
    },
  });

  const currentQuestionType = watch("question_type");

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
      });
    }
  }, [initialData, reset]);

  const submitFn = async (values) => {
    try {
      setReqLoading(true);
      const baseUrl = `/editor/${sectionType}-groups/`;
      const url = id ? `${baseUrl}${id}/` : baseUrl;
      const method = id ? "patch" : "post";

      // 1. Generatordan template va javoblarni olamiz
      const generatorData = generatorRef.current?.getFormattedData();

      // 2. Jo'natiladigan asosiy ma'lumotlar obyekti
      const payload = {
        instruction: values.instruction,
        order: values.order,
        template: generatorData?.template || "",
        correct_answers: generatorData?.correct_answers || [], // Array holatida
      };

      // 3. Section turiga qarab qo'shimcha maydonlarni qo'shamiz
      if (sectionType === "listening") {
        payload.part = partId;
        payload.question_type = values.question_type;
      } else if (sectionType === "reading") {
        payload.group_type = values.question_type;
        payload.passage = passageId;
        payload.text_content = values.text_content || "";
      }

      // 4. RASM bor yoki yo'qligini tekshiramiz
      const hasImage = values.file && values.file instanceof File;

      let response;

      if (hasImage) {
        // AGAR RASM BO'LSA: FormData orqali yuboramiz
        const formData = new FormData();

        // Oddiy maydonlarni append qilamiz
        Object.keys(payload).forEach((key) => {
          if (key === "correct_answers") {
            // Multipart-da array yuborish uchun stringify kerak,
            // lekin backend buni handle qila olishi shart (json.loads)
            formData.append(key, JSON.stringify(payload[key]));
          } else {
            formData.append(key, payload[key]);
          }
        });

        // Rasmni append qilamiz
        formData.append("image", values.file);

        response = await authAxios({
          method: method,
          url: url,
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // AGAR RASM YO'Q BO'LSA: To'g'ridan-to'g'ri JSON yuboramiz (BU XATONI OLDINI OLADI)
        response = await authAxios({
          method: method,
          url: url,
          data: payload,
          headers: { "Content-Type": "application/json" },
        });
      }

      toast.success("Successfully saved!");
      closeOffcanvas("questionGeneratorOffcanvas", response?.data);
    } catch (e) {
      console.error("Submit Error:", e);
      const errorData = e?.response?.data;

      // Xatolik xabarini chiroyli ko'rsatish
      let errorMsg = "Error, please wait a bit";
      if (typeof errorData === "object") {
        // Backenddan kelgan obyekt ko'rinishidagi xatolarni yig'ish
        errorMsg = JSON.stringify(errorData);
      }

      toast.error(errorMsg);
    } finally {
      setReqLoading(false);
    }
  };

  // 1. Rasmni preview qilish uchun state qo'shing
  const [imagePreview, setImagePreview] = useState(initialData?.image || null);

  // 2. FileInput o'zgarganda previewni yangilash
  const watchedFile = watch("file");
  useEffect(() => {
    if (watchedFile && watchedFile instanceof File) {
      const objectUrl = URL.createObjectURL(watchedFile);
      setImagePreview(objectUrl);

      // Memory leak bo'lmasligi uchun tozalash
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [watchedFile]);

  const formattedInitialData = useMemo(() => {
    return prepareInitialData(initialData?.template);
  }, [initialData]);

  const handleAiContent = (htmlContent) => {
    if (generatorRef.current) {
      // appendContent - bu bizning generator komponentimizdagi custom metod
      // U editor.commands.insertContent(htmlContent) ni chaqirishi kerak
      generatorRef.current.appendContent(htmlContent);

      // Foydalanuvchiga vizual signal
      toast.info("Ma'lumotlar editorga joylandi. Tekshirib ko'ring.");
    } else {
      toast.error("Editor hali yuklanmadi!");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submitFn)}
      className="flex flex-col items-center gap-6 p-1"
    >
      <div className="w-full flex flex-col  items-center gap-6 relative z-[15]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {/* Instruction */}
          <div className="col-span-1 md:col-span-2">
            <Input
              register={register}
              name="instruction"
              title="Instruction"
              placeholder="e.g. Choose the correct heading for paragraphs A-E"
              required
            />
          </div>

          {/* Question Type */}
          <Controller
            name="question_type"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                title="Question Type"
                options={filterQuestionTypes(sectionType, partNumber)}
              />
            )}
          />

          {/* Order */}
          <Input type="number" register={register} name="order" title="Order" />

          {/* TEXT CONTENT (Only for Reading) */}
          {sectionType === "reading" && (
            <div className="col-span-1 md:col-span-2">
              <RichTextEditor
                name="text_content"
                control={control}
                label="Passage Body"
                placeholder="Paste or write your IELTS passage here..."
                error={errors.text_content}
              />
            </div>
          )}

          {/* Image Field */}
          {QUESTION_TYPES_WITH_IMAGE.includes(currentQuestionType) && (
            <div className="col-span-1 md:col-span-2">
              <FileInput
                label="Upload Image/Diagram"
                name="file"
                control={control}
                accept="image/*"
              />
            </div>
          )}
        </div>
      </div>
      {/* {!id && currentQuestionType && (
        <GeminiScanner
          questionType={currentQuestionType}
          onScanComplete={handleAiContent}
        />
      )} */}
      {currentQuestionType && (
        <CompletionQGenerator
          ref={generatorRef}
          initialData={formattedInitialData}
          diagramImage={imagePreview}
        />
      )}

      <button
        type="submit"
        disabled={reqLoading}
        className="rounded-xl bg-main flex items-center justify-center gap-1 text-white min-w-[300px] p-4 font-bold hover:bg-opacity-90 transition-all"
      >
        {reqLoading && <ButtonSpinner />} {id ? "Update" : "Create"}
      </button>
    </form>
  );
}
