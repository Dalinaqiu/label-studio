import { type FC, type MouseEvent, useCallback, useMemo } from "react";
import { cn } from "../../utils/bem";
import { IconCross } from "@humansignal/icons";
import "./HeidiTip.scss";
import { Button } from "@humansignal/ui";
import { HeidiSpeaking } from "../../assets/images";
import type { HeidiTipProps, Tip } from "./types";
import { createURL } from "./utils";

const HeidiLink: FC<{ link: Tip["link"]; onClick: () => void }> = ({ link, onClick }) => {
  const url = useMemo(() => {
    const params = link.params ?? {};
    /* if needed, add server ID here */

    return createURL(link.url, params);
  }, [link]);

  return (
    <a
      className={cn("heidy-tip").elem("link").toClassName()}
      href={url}
      target="_blank"
      onClick={onClick}
      rel="noreferrer"
    >
      {link.label}
    </a>
  );
};

export const HeidiTip: FC<HeidiTipProps> = ({ tip, onDismiss, onLinkClick }) => {
  const handleClick = useCallback((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onDismiss();
  }, []);

  return (
    <div className={cn("heidy-tip").toClassName()}>

    </div>
  );
};
