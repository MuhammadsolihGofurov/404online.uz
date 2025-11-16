import React from "react";
import { useIntl } from "react-intl";
import { AvatarForm, FullNameForm, UpdatePasswordForm } from "./details";
import useSWR from "swr";
import { useRouter } from "next/router";
import fetcher from "@/utils/fetcher";

export default function MySettings({ user }) {
  const intl = useIntl();
  const router = useRouter();

  const { data: center } = useSWR(
    user?.role === "CENTER_ADMIN"
      ? [`/centeradmin/center/${user?.center}/`, router.locale, router]
      : null,
    ([url, locale]) =>
      fetcher(
        url,
        {
          headers: {
            "Accept-Language": locale,
          },
        },
        {},
        true
      )
  );

  return (
    <Wrapper>
      <AvatarForm user={user} />
      <hr />
      <FullNameForm
        old_full_name={user?.full_name}
        description={user?.description}
        role={user?.role}
        center_id={user?.center}
      />
      <hr />
      <UpdatePasswordForm />
      <hr />
      {user?.role === "CENTER_ADMIN" && (
        <>
          <h3 className="text-2xl font-semibold text-textPrimary">
            {intl.formatMessage({ id: "My Center details" })}
          </h3>
          <AvatarForm user={user} page={"myCenter"} center={center} />
          <hr />
          <FullNameForm
            old_full_name={user?.full_name}
            description={center?.description}
            old_center_name={center?.name}
            role={user?.role}
            center_id={user?.center}
            page={"myCenter"}
          />
        </>
      )}
    </Wrapper>
  );
}

export const Wrapper = ({ children }) => {
  return (
    <div className="p-5 rounded-2xl flex flex-col gap-10 bg-white w-full">
      {children}
    </div>
  );
};
