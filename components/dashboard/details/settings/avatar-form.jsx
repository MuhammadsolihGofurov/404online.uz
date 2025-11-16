import { AvatarInput } from "@/components/custom/details";
import { authAxios } from "@/utils/axios";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useIntl } from "react-intl";
import { toast } from "react-toastify";

export default function AvatarForm({ user, page, center }) {
  const intl = useIntl();
  const router = useRouter();
  const [reqLoading, setReqLoading] = useState(false);
  const isMyCenterPage = page === "myCenter";

  const url = isMyCenterPage ? "/centers/avatar/" : "/accounts/me/avatar/";

  const uploadAvatar = async (file) => {
    try {
      setReqLoading(true);

      const formData = new FormData();
      formData.append("avatar", file);

      await authAxios.put(url, formData);

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
        {intl.formatMessage({
          id: isMyCenterPage ? "My center avatar" : "Profile avatar",
        })}
      </h2>

      <AvatarInput
        initialImage={isMyCenterPage ? center?.avatar : user?.avatar}
        onUpload={uploadAvatar}
        reqLoading={reqLoading}
      />
    </div>
  );
}
