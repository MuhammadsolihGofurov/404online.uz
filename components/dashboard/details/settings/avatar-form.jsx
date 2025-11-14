import { AvatarInput } from "@/components/custom/details";
import { authAxios } from "@/utils/axios";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useIntl } from "react-intl";
import { toast } from "react-toastify";

export default function AvatarForm({ user }) {
  const intl = useIntl();
  const router = useRouter();
  const [reqLoading, setReqLoading] = useState(false);

  const uploadAvatar = async (file) => {
    try {
      setReqLoading(true);

      const formData = new FormData();
      formData.append("avatar", file);

      await authAxios.put(`/accounts/me/avatar/`, formData);

      toast.success(intl.formatMessage({ id: "Avatar updated successfully!" }));

      router.replace(router.asPath);
    } catch (err) {
      console.log(err);
      toast.error(intl.formatMessage({ id: "Something went wrong" }));
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-5">
      <h2 className="text-textPrimary font-semibold text-base">
        {intl.formatMessage({ id: "Profile avatar" })}
      </h2>

      <AvatarInput
        initialImage={user?.avatar}
        onUpload={uploadAvatar}
        reqLoading={reqLoading}
      />
    </div>
  );
}
