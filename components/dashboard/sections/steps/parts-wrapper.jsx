import { useParams } from "@/hooks/useParams";
import fetcher from "@/utils/fetcher";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import useSWR from "swr";
import { ButtonSpinner } from "@/components/custom/loading";
import { PartsContent, PartsTab } from "./details";

export default function PartsWrapper() {
  const { findParams } = useParams();
  const router = useRouter();

  const sectionType = findParams("section") || null;
  const sectionId = findParams("sectionId") || null;
  const activePartId = findParams("partId") || null;

  const { data: sectionData, isLoading: isFetching } = useSWR(
    sectionId ? [`/mocks/${sectionType}/${sectionId}/`, router.locale] : null,
    ([url, locale]) =>
      fetcher(url, { headers: { "Accept-Language": locale } }, {}, {}, true)
  );

  const items = useMemo(() => {
    if (!sectionData) return [];
    if (sectionType === "listening") return sectionData.parts || [];
    if (sectionType === "reading") return sectionData.passages || [];
    if (sectionType === "writing") return sectionData.tasks || [];
    return [];
  }, [sectionData, sectionType]);

  if (isFetching)
    return (
      <div className="p-10 flex justify-center">
        <ButtonSpinner />
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      {/* --- TABS SECTION --- */}
      <PartsTab
        items={items}
        activePartId={activePartId}
        sectionType={sectionType}
      />

      {/* --- CONTENT SECTION --- */}
      <PartsContent activePartId={activePartId} sectionType={sectionType} />
    </div>
  );
}
