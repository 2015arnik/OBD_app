import { useState } from "react";

export default function PasswordField({
  label,
  value,
  onChange,
  required = false,
  minLength,
  placeholder
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      {label}
      <div className="password-field">
        <input
          required={required}
          type={visible ? "text" : "password"}
          minLength={minLength}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
        >
          {visible ? "Скрыть" : "Показать"}
        </button>
      </div>
    </label>
  );
}
