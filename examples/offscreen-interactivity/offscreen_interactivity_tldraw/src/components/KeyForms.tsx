import React, { useState } from 'react';

interface KeyFormsProps {
  onSubmit?: (keys: ServerKeys) => void;
}

interface ServerKeys {
  applicationKey: string;
  hmacKey: string;
  host: string;
  scheme: string;
}

const getServerFromStorage = (): Partial<ServerKeys> => {
  try {
    return JSON.parse(localStorage.getItem("server") || "{}");
  } catch {
    return {};
  }
};

export const KeyForms: React.FC<KeyFormsProps> = ({ onSubmit }) => {
  const stored = getServerFromStorage();

  const [host, setHost] = useState(stored.host ?? "");
  const [scheme, setScheme] = useState(stored.scheme ?? "https");
  const [applicationKey, setApplicationKey] = useState(stored.applicationKey ?? "");
  const [hmacKey, setHmacKey] = useState(stored.hmacKey ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ host, scheme, applicationKey, hmacKey });
  };

  return (
      <form onSubmit={handleSubmit} className="key-forms">
        <h3>Set your server configuration</h3>

        <a
          href="https://developer.myscript.com/getting-started/"
          className="form-a"
          target="_blank"
          rel="noopener noreferrer"
        >
          You can generate your Application Key and HMAC Key for free
        </a>

        <div className="form-group">
          <label htmlFor="host">Host:</label>
          <input
            id="host"
            type="text"
            value={host}
            placeholder="cloud.myscript.com"
            onChange={(e) => setHost(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="scheme">Scheme:</label>
          <select
            id="scheme"
            value={scheme}
            onChange={(e) => setScheme(e.target.value)}
          >
            <option value="https">https</option>
            <option value="http">http</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="applicationKey">Application Key:</label>
          <input
            id="applicationKey"
            type="text"
            value={applicationKey}
            onChange={(e) => setApplicationKey(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="hmacKey">HMAC Key:</label>
          <input
            id="hmacKey"
            type="text"
            value={hmacKey}
            onChange={(e) => setHmacKey(e.target.value)}
            required
          />
        </div>

        <button type="submit">Save</button>

        <a
          href="https://cloud.myscript.com/#/applications"
          className="form-a"
          target="_blank"
          rel="noopener noreferrer"
        >
          Already have an Application Key and HMAC Key? Go to MyScript Cloud to retrieve them.
        </a>
      </form>
  );
};
