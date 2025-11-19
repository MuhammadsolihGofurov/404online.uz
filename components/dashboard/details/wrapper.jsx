import { DASHBOARD_URL } from "@/mock/router";
import { WrapperHeader } from ".";

export default function Wrapper({
  title,
  body,
  isLink = false,
  url = DASHBOARD_URL,
  isButton = false,
  name,
  children,
  buttonText,
  buttonFunc,
  modalType,
  isWrapperClose = false,
  isIcon,
}) {
  return (
    <div className="flex flex-col gap-8 items-start">
      {!isWrapperClose && (
        <WrapperHeader
          title={title}
          body={body}
          isLink={isLink}
          url={url}
          isButton={isButton}
          name={name}
          buttonText={buttonText}
          buttonFunc={buttonFunc}
          modalType={modalType}
          isIcon={isIcon}
        />
      )}
      <div className="flex flex-col gap-5 w-full">{children}</div>
    </div>
  );
}
