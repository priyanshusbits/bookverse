import React, { useState } from 'react';

type CopyToClipboardButtonProps = {
  value: string;
};

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const textField = document.createElement('textarea');
    textField.innerText = value;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    document.body.removeChild(textField);
    setCopied(true);
  };

  return (
    <div>
      <button onClick={copyToClipboard}>Copy to Clipboard</button>
      {copied && <p>Copied to clipboard: {value}</p>}
    </div>
  );
};

export default CopyToClipboardButton;
