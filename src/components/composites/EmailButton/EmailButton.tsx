import {
  Button,
  ButtonHotkey,
  ButtonLabel,
  ButtonLeadingIcon,
  ButtonTrailingIcon,
} from "@/components/primitives/Button";

import { useClipboard } from "@/hooks/useClipboard";

import CopyAllIcon from "@material-symbols/svg-700/sharp/copy_all-fill.svg?react";
import LibraryAddCheckIcon from "@material-symbols/svg-700/sharp/library_add_check-fill.svg?react";
import MailIcon from "@material-symbols/svg-700/sharp/mail-fill.svg?react";

function EmailButton({ ...props }) {
  const { copy, isCopied } = useClipboard();

  const handleCopy = () => {
    copy("w@abhishekrein.xyz");
  };

  const copyEmailHotkey = "Shift+W";

  return (
    <Button onClick={handleCopy} {...props}>
      <ButtonLeadingIcon>
        <MailIcon />
      </ButtonLeadingIcon>
      <ButtonLabel>w@abhishekrein.xyz</ButtonLabel>
      <ButtonTrailingIcon>
        {!isCopied ? <CopyAllIcon /> : <LibraryAddCheckIcon />}
      </ButtonTrailingIcon>
      <ButtonHotkey keys={copyEmailHotkey} />
    </Button>
  );
}

export { EmailButton };
