import { X } from "lucide-react";
import React, { useRef, useState } from "react";

export default function ImageUploadBox({ value, onChange }) {
  const [images, setImages] = useState([]);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const arr = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(2),
    }));
    const updated = [...images, ...arr];
    setImages(updated);
    onChange(updated.map((i) => i.file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (id) => {
    const updated = images.filter((img) => img.id !== id);
    setImages(updated);
    onChange(updated.map((i) => i.file));
  };

  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleDragStart = (index) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    const newList = [...images];
    const draggedItem = newList[dragItem.current];

    newList.splice(dragItem.current, 1);
    newList.splice(dragOverItem.current, 0, draggedItem);

    dragItem.current = null;
    dragOverItem.current = null;

    setImages(newList);
    onChange(newList.map((i) => i.file));
  };

  return (
    <div className="w-full">
      <div
        className="border-2 border-dashed border-gray-400 rounded-2xl p-6 flex flex-wrap gap-4 items-center cursor-pointer hover:bg-gray-50 min-h-[200px]"
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {images.length === 0 && (
          <p className="text-gray-600 text-center w-full text-sm">
            Upload images
          </p>
        )}

        {images.map((img, index) => (
          <div
            key={img.id}
            className="relative bg-white shadow rounded-xl p-2 cursor-grab flex flex-col items-center"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
          >
            {/* Delete button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // dragni oldini olish
                handleRemove(img.id);
              }}
              className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X />
            </button>

            <img
              src={img.preview}
              alt="preview"
              className="w-24 h-24 object-cover rounded-lg"
            />
            <p className="text-xs text-gray-600 mt-1 max-w-[90px] truncate">
              {img.file.name}
            </p>
          </div>
        ))}

        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          ref={inputRef}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
