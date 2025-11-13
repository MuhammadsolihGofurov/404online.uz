import { useState, useEffect } from "react";
import { useParams } from "./useParams";

export const usePagination = (count, pageSize = 10) => {
  const { updateParams, findParams } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(count / pageSize);

  useEffect(() => {
    const page = parseInt(findParams("page")) || 1;
    setCurrentPage(page);
  }, [findParams("page")]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    updateParams("page", page);
  };

  const nextPage = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };

  const pagesArray = () => {
    // Mobile-friendly: show first, last and 2 pages around current
    const pages = [];
    const delta = 2;
    let start = Math.max(2, currentPage - delta);
    let end = Math.min(totalPages - 1, currentPage + delta);

    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");

    return pages;
  };

  return {
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    pagesArray,
  };
};
