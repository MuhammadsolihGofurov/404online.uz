import React from "react";
import { useIntl } from "react-intl";
import { AvatarForm, FullNameForm, UpdatePasswordForm } from "./details";

export default function MySettings({ user }) {
  const intl = useIntl();
  return (
    <Wrapper>
      <AvatarForm user={user} />
      <hr />
      <FullNameForm old_full_name={user?.full_name} />
      <hr />
      <UpdatePasswordForm />
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
