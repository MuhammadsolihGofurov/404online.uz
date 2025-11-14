import React, { useState, useRef, useEffect } from "react";
import { ButtonSpinner } from "../loading";
import { Edit2Icon } from "lucide-react";

export default function AvatarInput({
  initialImage = " ",
  onUpload,
  accept = "image/*",
  reqLoading = false,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(initialImage || " ");

  useEffect(() => {
    setPreview(initialImage);
    // return () => {
    //   if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    // };
  }, [preview, initialImage]);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);

    if (onUpload) onUpload(file);
  };

  return (
    <div className="flex flex-col items-start gap-2 relative">
      {/* Avatar box */}
      <div className="w-24 h-24 rounded-full bg-gray-100 border border-buttonGrey overflow-hidden cursor-pointer flex items-center justify-center hover:opacity-90 transition">
        {preview ? (
          <img
            src={preview}
            alt="avatar preview"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <></>
        )}
        <div className={`absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 flex items-center justify-center w-10 h-10 bg-white shadow-md rounded-full z-[7] ${initialImage ? "bg-opacity-10 backdrop-blur-sm" :"bg-opacity-100"}`}>
          <Edit2Icon className="w-4 h-4 text-main font-semibold " />
        </div>
        {/* Loading overlay */}
        {reqLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full z-[9]">
            <ButtonSpinner mainColor="border-t-main" />
          </div>
        )}
        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="opacity-0 w-full h-full absolute top-0 left-0 z-10 cursor-pointer"
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
