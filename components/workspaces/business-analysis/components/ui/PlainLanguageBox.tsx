import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export default function PlainLanguageBox({ title, children }: Props) {
  return (
    <div className="plain-box">
      <div className="plain-box__title">{title}</div>
      <div className="plain-box__body">{children}</div>
    </div>
  );
}
