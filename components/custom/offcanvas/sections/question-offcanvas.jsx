import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useParams } from "@/hooks/useParams";
import { useOffcanvas } from "@/context/offcanvas-context";
import { authAxios } from "@/utils/axios";

// Components
import { ButtonSpinner } from "../../loading";
import {
  McqQuestionForm,
  FormCompletionForm,
  MapDiagramForm,
  MatchingQuestionForm,
  MatchingHeadingForm,
  TFNGFORM,
  SummaryQuestionForm,
} from "./types";
import {
  generateQuestionPayload,
  parseInitialTokens,
} from "@/utils/question-helpers";
import { Input, SmartTextarea } from "../../details";

// Token talab qilmaydigan (Raqamga asoslangan) turlar
const TYPES_WITHOUT_TOKEN = [
  "MATCH_HEADINGS",
  "MATCH_INFO",
  "MATCH_FEATURES",
  "CLASSIFICATION",
  "TFNG",
  "YNNG",
  "MATCHING",
];

export default function QuestionOffcanvas({ id, initialData }) {
  const { closeOffcanvas } = useOffcanvas();
  const { findParams } = useParams();
  const [reqLoading, setReqLoading] = useState(false);

  // Group options kerak bo'ladigan turlar
  const TYPES_REQUIRING_GROUP_OPTIONS = useMemo(
    () => ["MATCH_HEADINGS", "MATCH_INFO", "MATCH_FEATURES", "CLASSIFICATION"],
    []
  );

  const [groupOptions, setGroupOptions] = useState([]);
  const sectionType = findParams("section") || "listening";
  const groupId = findParams("groupId") || "";
  const questionType = findParams("questionType") || initialData?.question_type;

  const { register, handleSubmit, control, watch, setValue } = useForm({
    mode: "onChange",
    defaultValues: {
      question_number: initialData?.question_number || 1,
      text: initialData?.text || "",
      tokens: initialData ? parseInitialTokens(initialData) : [],
      mcq_display_type: initialData?.metadata?.gap_1?.display || "radio",
      mcq_options: initialData?.metadata?.gap_1?.options?.map((o) => ({
        text: o.text,
      })) || [{ text: "" }, { text: "" }, { text: "" }],
    },
  });

  const watchText = watch("text") || "";

  // 1. Guruh variantlarini yuklash
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        if (
          sectionType === "reading" &&
          TYPES_REQUIRING_GROUP_OPTIONS.includes(questionType) &&
          groupId
        ) {
          const res = await authAxios.get(`/editor/reading-groups/${groupId}/`);
          setGroupOptions(res.data.common_options || []);
        }
      } catch (err) {
        console.error("Error fetching group options:", err);
      }
    };
    fetchGroupData();
  }, [groupId, sectionType, questionType, TYPES_REQUIRING_GROUP_OPTIONS]);

  // 2. TOKENLARNI AVTOMATIK ANIQLASH (RAQAM YOKI {{TOKEN}} BO'YICHA)
  useEffect(() => {
    if (questionType === "MCQ") return;

    let updatedTokens = [];
    const currentTokens = watch("tokens") || [];

    if (TYPES_WITHOUT_TOKEN.includes(questionType)) {
      // MATCHING, TFNG, YNNG uchun: Matnni qator boshidagi raqamlarga qarab bo'lamiz
      const lines = watchText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.match(/^\d+/));

      updatedTokens = lines.map((line) => {
        const qNumber = line.match(/^(\d+)/)[1];
        const tokenId = `q_${qNumber}`;
        const existing = currentTokens.find((t) => t.id === tokenId);

        return (
          existing || {
            id: tokenId,
            answers: "",
            type: "dropdown",
          }
        );
      });
    } else {
      // COMPLETION turlari uchun: Faqat {{}} belgisini qidiramiz
      const lines = watchText.split("\n");
      let foundTokens = [];

      lines.forEach((line) => {
        const matches = [...line.matchAll(/{{(.*?)}}/g)];
        const lineNumMatch = line.match(/^(\d+)/); // Qator boshidagi raqam (masalan "14.")

        matches.forEach((m) => {
          const tName = m[1];
          const existing = currentTokens.find((t) => t.id === tName);

          foundTokens.push(
            existing || {
              id: tName,
              answers: "",
              // Agar qatorda raqam bo'lsa, uni vaqtincha saqlaymiz (yordamchi sifatida)
              temp_number: lineNumMatch ? lineNumMatch[1] : null,
              type:
                questionType === "MAP_DIAGRAM" ? "zone_select" : "text_input",
            }
          );
        });
      });
      updatedTokens = foundTokens;
    }

    // Infinite loop'dan qochish uchun faqat ID'lar o'zgarganda setValue qilamiz
    const currentIds = currentTokens.map((t) => t.id).join(",");
    const newIds = updatedTokens.map((t) => t.id).join(",");

    if (currentIds !== newIds) {
      setValue("tokens", updatedTokens);
    }
  }, [watchText, questionType, setValue]);

  // 3. SUBMIT MANTIQI
  const submitFn = async (values) => {
    try {
      setReqLoading(true);

      if (id || questionType === "MCQ") {
        const payload = generateQuestionPayload(questionType, values, groupId);
        await authAxios({
          method: id ? "patch" : "post",
          url: `/editor/${sectionType}-questions/${id ? id + "/" : ""}`,
          data: payload,
        });
        toast.success("Saved successfully!");
        closeOffcanvas("questionOffcanvas", { refresh: true });
        return;
      }

      // 2. Yaxlit matnli turlar uchun BULK SAVE (SUMMARY, TABLE_FLOWCHART, MAP_DIAGRAM)
      // Bu turlarda matnni bo'lmasdan, har bir token uchun alohida request yuboramiz
      const isUnifiedType = ["TABLE_FLOWCHART", "MAP_DIAGRAM"].includes(
        questionType
      );

      if (isUnifiedType) {
        const requests = values.tokens.map((token) => {
          // Backend bitta matnda bir nechta {{token}} ko'rib, 1 ta javob kelsa 400 beradi.
          // Shuning uchun joriy tokendan boshqasini "........" bilan maskalaymiz.
          let maskedText = values.text;
          values.tokens.forEach((t) => {
            if (t.id !== token.id) {
              maskedText = maskedText.replace(`{{${t.id}}}`, "........");
            }
          });

          // Tokenning savol raqamini matndan qidirib topish
          const qNumber = getDisplayQuestionNumber(
            questionType,
            token,
            0,
            values.text
          );

          const payload = {
            question_number: parseInt(qNumber),
            text: maskedText,
            group: groupId,
            correct_answer: {
              [token.id]: token.answers.split(",").map((a) => a.trim()),
            },
            metadata: {
              [token.id]: {
                type:
                  token.type ||
                  (questionType === "MAP_DIAGRAM"
                    ? "zone_select"
                    : "text_input"),
                max_words: parseInt(token.max_words) || 2,
              },
            },
          };
          return authAxios.post(`/editor/${sectionType}-questions/`, payload);
        });

        await Promise.all(requests);
        toast.success(`${requests.length} items added successfully!`);
        closeOffcanvas("questionOffcanvas", { refresh: true });
        return;
      }

      // BULK INSERT MANTIQI
      const questionBlocks = values.text
        .split(/(?=\n\d+\.|\s\d+\.|^ \d+\.)|(?=^\d+\.)/gm)
        .map((b) => b.trim())
        .filter((b) => b.length > 0);

      const requests = questionBlocks
        .map((block) => {
          const match = block.match(/^(\d+)\.\s*([\s\S]+)/);
          if (!match) return null;

          const qNumber = parseInt(match[1], 10);
          const qText = match[2].trim();
          const isNoToken = TYPES_WITHOUT_TOKEN.includes(questionType);

          // Tegishli tokenlarni ajratib olish
          const blockTokens = (values.tokens || []).filter((t) =>
            isNoToken ? t.id === `q_${qNumber}` : qText.includes(`{{${t.id}}}`)
          );

          const blockValues = {
            ...values,
            question_number: qNumber,
            text: qText,
            tokens: blockTokens,
            group_options: TYPES_REQUIRING_GROUP_OPTIONS.includes(questionType)
              ? groupOptions
              : null,
          };

          const payload = generateQuestionPayload(
            questionType,
            blockValues,
            groupId
          );

          // Backend {{}} talab qilsa (No-token turlar uchun)
          if (isNoToken && payload.text && !payload.text.includes("{{")) {
            payload.text = `${payload.text} {{q_${qNumber}}}`;
          }

          return authAxios.post(`/editor/${sectionType}-questions/`, payload);
        })
        .filter(Boolean);

      await Promise.all(requests);
      toast.success(`${requests.length} questions added!`);
      closeOffcanvas("questionOffcanvas", { refresh: true });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Error occurred");
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-1">
      <h2 className="text-xl font-bold border-b pb-4 uppercase">
        {questionType?.replace("_", " ")} - {id ? "Edit" : "Create"}
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
          <SmartTextarea
            name="text"
            title="Question Content"
            register={register}
            watch={watch}
            setValue={setValue}
            questionType={questionType}
          />
        </div>

        {/* DINAMIK FORMALAR */}
        {questionType === "MCQ" && (
          <McqQuestionForm
            register={register}
            control={control}
            watch={watch}
            setValue={setValue}
          />
        )}

        {questionType === "TABLE_FLOWCHART" && (
          <FormCompletionForm
            register={register}
            control={control}
            watch={watch}
            questionType={questionType}
            startNumber={watch("question_number")}
          />
        )}

        {/* MAP_DIAGRAM (Diagrammalar) uchun */}
        {questionType === "MAP_DIAGRAM" && (
          <MapDiagramForm
            register={register}
            control={control}
            watch={watch}
            startNumber={watch("question_number")}
          />
        )}

        {(questionType === "MATCH_INFO" ||
          questionType === "MATCH_FEATURES" ||
          questionType === "MATCH_HEADINGS") && (
          <MatchingHeadingForm
            register={register}
            control={control}
            setValue={setValue}
            watch={watch}
            availableOptions={groupOptions}
            questionType={questionType}
            startNumber={watch("question_number")}
          />
        )}

        {(questionType === "TFNG" || questionType === "YNNG") && (
          <TFNGFORM
            register={register}
            control={control}
            watch={watch}
            questionType={questionType}
            startNumber={watch("question_number")}
          />
        )}

        {["COMPLETION", "SENTENCE", "SHORT_ANSWER"].includes(questionType) && (
          <FormCompletionForm
            register={register}
            control={control}
            watch={watch}
            questionType={questionType}
            startNumber={watch("question_number")}
          />
        )}

        {["MATCHING"].includes(questionType) && (
          <MatchingQuestionForm
            register={register}
            control={control}
            watch={watch}
            questionType={questionType}
            startNumber={watch("question_number")}
          />
        )}

        {["SUMMARY"].includes(questionType) && (
          <SummaryQuestionForm
            register={register}
            control={control}
            watch={watch}
            questionType={questionType}
            startNumber={watch("question_number")}
          />
        )}

        <button
          type="submit"
          disabled={reqLoading}
          className="w-full bg-main text-white p-4 rounded-xl font-bold flex justify-center hover:bg-opacity-90 transition-all disabled:bg-gray-400"
        >
          {reqLoading ? <ButtonSpinner /> : id ? "Update" : "Bulk Save"}
        </button>
      </form>
    </div>
  );
}
