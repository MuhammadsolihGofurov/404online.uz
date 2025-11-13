import React from "react";
import { useIntl } from "react-intl";

export default function MySettings({ user, loading }) {
  const intl = useIntl();
  return (
    <Wrapper>
      <h2 className="text-textPrimary font-medium text-base">{intl.formatMessage({id: "Profile avatar"})}</h2>
      
    </Wrapper>
  );
}

export const Wrapper = ({ children }) => {
  return <div className="p-5 rounded-2xl bg-white">{children}</div>;
};
