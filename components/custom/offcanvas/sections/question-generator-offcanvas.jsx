import React from "react";
import { useParams } from "@/hooks/useParams";
import { useOffcanvas } from "@/context/offcanvas-context";
import { CompletionQGenerator } from "./generators";

export default function QuestionGeneratorOffcanvas({ id, initialData }) {
  const { closeOffcanvas } = useOffcanvas();
  const { findParams } = useParams();

  const sectionType = findParams("section") || "listening";
  const groupId = findParams("groupId") || "";
  const questionType = findParams("questionType") || initialData?.question_type;
  const partId = findParams("partId");

  return (
    <div className="flex flex-col gap-6 p-1">
      {questionType === "COMPLETION" && (
        <CompletionQGenerator
          initialData={initialData}
          onSave={(item) => console.error(item)}
        />
      )}
    </div>
  );
}
