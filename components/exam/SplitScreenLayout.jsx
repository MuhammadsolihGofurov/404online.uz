import React, { useState, useRef, useEffect } from "react";
import { GripVertical, FileText, ClipboardList } from "lucide-react";
import { useIntl } from "react-intl";

/**
 * SplitScreenLayout
 * 
 * IELTS Reading split-screen layout with resizable panes.
 * Left pane: Reading passage (scrollable)
 * Right pane: Questions (scrollable)
 * 
 * Mobile: Tabbed view or stacked layout
 */
export function SplitScreenLayout({
  passage,
  questions,
  sectionTitle = "Reading",
  leftPaneTitle = "Reference Material",
  onMobile = "tabs" // "tabs" or "stack"
}) {
  const intl = useIntl();
  const [leftWidth, setLeftWidth] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("passage"); // "passage" or "questions"
  const containerRef = useRef(null);
  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);

  // Handle resize dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Constrain between 30% and 70%
    if (newLeftWidth >= 30 && newLeftWidth <= 70) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      };
    }
  }, [isDragging]);

  // Scroll Reset Logic - Reset both panes when section changes
  useEffect(() => {
    if (leftPaneRef.current) {
      leftPaneRef.current.scrollTop = 0;
    }
    if (rightPaneRef.current) {
      rightPaneRef.current.scrollTop = 0;
    }
  }, [passage, questions]);

  // Desktop: Split-screen layout
  const DesktopLayout = () => (
    <div
      ref={containerRef}
      className="hidden md:flex h-full w-full relative"
    >
      {/* Left Pane: Reading Passage */}
      <div
        className="flex flex-col border-r border-gray-200 bg-white"
        style={{ width: `${leftWidth}%` }}
      >
        {/* Passage Header */}
        <div className="sticky top-0 z-10 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-800">
              {leftPaneTitle}
            </h3>
          </div>
        </div>

        {/* Passage Content (Scrollable) */}
        <div ref={leftPaneRef} className="flex-1 overflow-y-auto px-8 py-6 reading-passage font-[Arial,Helvetica,sans-serif] leading-[1.6] text-[16px] text-gray-800 selection:bg-yellow-200 selection:text-black">
          {passage}
        </div>
      </div>

      {/* Resizer Handle */}
      <div
        className="w-1 bg-gray-200 hover:bg-main cursor-col-resize flex items-center justify-center relative group transition-colors"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 left-[-4px] right-[-4px] z-20" />
        <GripVertical
          size={16}
          className="text-gray-400 group-hover:text-main absolute z-30 pointer-events-none"
        />
      </div>

      {/* Right Pane: Questions */}
      <div
        className="flex flex-col bg-white"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {/* Questions Header */}
        <div className="sticky top-0 z-10 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-800">
              {intl.formatMessage({ id: "Questions" })}
            </h3>
          </div>
        </div>

        {/* Questions Content (Scrollable) */}
        <div ref={rightPaneRef} className="flex-1 overflow-y-auto px-6 py-4">
          {questions}
        </div>
      </div>
    </div>
  );

  // Mobile: Tabbed view
  const MobileTabsLayout = () => (
    <div className="flex flex-col h-full md:hidden">
      {/* Tab Buttons */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          onClick={() => setActiveTab("passage")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "passage"
              ? "border-main text-main bg-blue-50"
              : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <FileText size={16} />
            <span>{intl.formatMessage({ id: "Passage" })}</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("questions")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "questions"
              ? "border-main text-main bg-blue-50"
              : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <ClipboardList size={16} />
            <span>{intl.formatMessage({ id: "Questions" })}</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        {activeTab === "passage" ? (
          <div className="px-4 py-4 reading-passage">{passage}</div>
        ) : (
          <div className="px-4 py-4">{questions}</div>
        )}
      </div>
    </div>
  );

  // Mobile: Stacked layout (passage top, questions bottom)
  const MobileStackLayout = () => (
    <div className="flex flex-col h-full md:hidden overflow-y-auto">
      {/* Passage Section */}
      <div className="bg-white border-b-4 border-gray-300 mb-4">
        <div className="sticky top-0 z-10 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-800">
              {leftPaneTitle}
            </h3>
          </div>
        </div>
        <div className="px-4 py-4 reading-passage">{passage}</div>
      </div>

      {/* Questions Section */}
      <div className="bg-white">
        <div className="sticky top-0 z-10 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-800">
              {intl.formatMessage({ id: "Questions" })}
            </h3>
          </div>
        </div>
        <div className="px-4 py-4">{questions}</div>
      </div>
    </div>
  );

  return (
    <>
      <DesktopLayout />
      {onMobile === "tabs" ? <MobileTabsLayout /> : <MobileStackLayout />}
    </>
  );
}

