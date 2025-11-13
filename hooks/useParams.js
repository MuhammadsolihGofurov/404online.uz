import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useLang } from "@/context/useLang";

export const useParams = () => {
  const { setLangUrls } = useLang();
  const router = useRouter();
  const [breadParams, setBreadParams] = useState({});

  const updateParams = (key, value) => {
    const currentQuery = { ...router.query };

    if (key === "skill_ids") {
      let skillIds = currentQuery.skill_ids
        ? new Set(currentQuery.skill_ids.split(",").map((id) => id.trim()))
        : new Set();

      if (skillIds.has(value.toString())) {
        skillIds.delete(value.toString()); // Agar mavjud bo‘lsa, olib tashlaymiz
      } else {
        skillIds.add(value.toString()); // Yangi qiymat qo‘shamiz
      }

      // Final natijani yaratamiz
      const newSkillIds = [...skillIds].join(",");

      // Agar bo‘sh bo‘lsa, query dan o‘chiramiz
      if (newSkillIds) {
        currentQuery.skill_ids = newSkillIds;
      } else {
        delete currentQuery.skill_ids;
      }
    } else {
      if (value) {
        currentQuery[key] = value;
      } else {
        delete currentQuery[key];
      }
    }

    // Routerga push qilish
    router.push({ pathname: router.pathname, query: currentQuery }, undefined, {
      shallow: true,
    });
  };

  const checkParams = (key, value) => {
    if (key === "skill_ids") {
      const skillIds = router.query.skill_ids
        ? router.query.skill_ids.split(",")
        : [];
      return skillIds.includes(value.toString());
    }
    return router.query[key] === value;
  };

  const findParams = (key) => {
    if (key === "skill_ids") {
      return router.query.skill_ids ? router.query.skill_ids.split(",") : [];
    }
    return router.query[key] || null;
  };

  const removeParams = (key) => {
    const updatedQuery = { ...router.query };
    delete updatedQuery[key];
    router.push({ pathname: router.pathname, query: updatedQuery }, undefined, {
      shallow: true,
    });
  };

  useEffect(() => {
    setBreadParams(router.query);
  }, [router.query]);

  return {
    updateParams,
    checkParams,
    findParams,
    removeParams,
    breadParams,
  };
};
