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
  MatchingEndingGenerator,
  MatchingHeadingsGenerator,
  MatchingInfoGenerator,
  MCQAutoGenerator,
  SentenceCompletionGenerator,
  ShortAnswerGenerator,
} from "./auto";

export default function QuestionOffcanvas({ id, initialData }) {
  const { closeOffcanvas } = useOffcanvas();
  const { findParams } = useParams();

  const sectionType = findParams("section") || "listening";
  const groupId = findParams("groupId") || "";
  const questionType = findParams("questionType") || initialData?.question_type;
  const partId = findParams("partId");

  const { register, handleSubmit, control, watch, setValue } = useForm({
    mode: "onChange",
    defaultValues: {
      tokens: [],
    },
  });

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* <h2 className="text-xl font-bold border-b pb-4 uppercase">
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
      </form> */}

      {questionType == "MCQ" && (
        <MCQAutoGenerator
          groupId={groupId}
          sectionType={sectionType}
          onClose={closeOffcanvas}
          id={id}
          initialData={initialData}
          question_Type={questionType}
        />
      )}

      {questionType == "SENTENCE" && (
        <SentenceCompletionGenerator
          groupId={groupId}
          sectionType={sectionType}
          onClose={closeOffcanvas}
          id={id}
          initialData={initialData}
          question_Type={questionType}
        />
      )}

      {questionType == "SHORT_ANSWER" && (
        <ShortAnswerGenerator
          groupId={groupId}
          sectionType={sectionType}
          onClose={closeOffcanvas}
          id={id}
          initialData={initialData}
          question_Type={questionType}
        />
      )}

      {questionType == "MATCH_HEADINGS" && (
        <MatchingHeadingsGenerator
          groupId={groupId}
          sectionType={sectionType}
          onClose={closeOffcanvas}
          id={id}
          initialData={initialData}
          question_Type={questionType}
        />
      )}

      {questionType == "MATCH_INFO" && (
        <MatchingInfoGenerator
          groupId={groupId}
          sectionType={sectionType}
          onClose={closeOffcanvas}
          id={id}
          initialData={initialData}
          question_Type={questionType}
          partId={partId}
        />
      )}

      {questionType == "MATCH_ENDINGS" && (
        <MatchingEndingGenerator
          groupId={groupId}
          sectionType={sectionType}
          onClose={closeOffcanvas}
          id={id}
          initialData={initialData}
          question_Type={questionType}
        />
      )}
    </div>
  );
}
