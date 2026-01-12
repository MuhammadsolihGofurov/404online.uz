import React, { useState } from "react";
import { useModal } from "@/context/modal-context";
import { ButtonSpinner } from "../../loading";
import { useIntl } from "react-intl";
import { toast } from "react-toastify";

export default function ConfirmModal({ title, description, onConfirm }) {
  const { closeModal } = useModal();
  const [loading, setLoading] = useState(false);
  const intl = useIntl();

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      setTimeout(() => {
        closeModal("confirmModal", "confirm");
      }, 300);
    } catch (err) {
      toast.error(err?.response?.data?.error?.[0]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-textPrimary">
        {intl.formatMessage({ id: title })}
      </h2>
      <p className="text-base text-textSecondary">
        {intl.formatMessage({ id: description })}
      </p>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          onClick={() => closeModal("confirmModal")}
          disabled={loading}
        >
          {intl.formatMessage({ id: "Cancel" })}
        </button>

        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-2"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading && <ButtonSpinner size="sm" />}
          {intl.formatMessage({ id: "Confirm" })}
        </button>
      </div>
    </div>
  );
}
