const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const normalizePassword = (value) => String(value || '').trim();

export const normalizeFullName = (value) => String(value || '').trim();

export const isValidEmail = (value) => EMAIL_REGEX.test(normalizeEmail(value));

export const validateAuthInput = ({
  email,
  password,
  fullName = '',
  requireFullName = false,
  minPasswordLength = 6,
}) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = normalizePassword(password);
  const normalizedFullName = normalizeFullName(fullName);

  if (!normalizedEmail) {
    return {
      ok: false,
      message: 'Please enter your email.',
      values: { normalizedEmail, normalizedPassword, normalizedFullName },
    };
  }

  if (!isValidEmail(normalizedEmail)) {
    return {
      ok: false,
      message: 'Please enter a valid email address.',
      values: { normalizedEmail, normalizedPassword, normalizedFullName },
    };
  }

  if (!normalizedPassword) {
    return {
      ok: false,
      message: 'Please enter your password.',
      values: { normalizedEmail, normalizedPassword, normalizedFullName },
    };
  }

  if (normalizedPassword.length < minPasswordLength) {
    return {
      ok: false,
      message: `Password must be at least ${minPasswordLength} characters.`,
      values: { normalizedEmail, normalizedPassword, normalizedFullName },
    };
  }

  if (requireFullName && normalizedFullName.length < 3) {
    return {
      ok: false,
      message: 'Please enter your full name.',
      values: { normalizedEmail, normalizedPassword, normalizedFullName },
    };
  }

  return {
    ok: true,
    message: '',
    values: { normalizedEmail, normalizedPassword, normalizedFullName },
  };
};

export const buildLoginPayload = ({ email, password }) => ({
  email: normalizeEmail(email),
  password: normalizePassword(password),
});

export const buildRegisterPayload = ({ fullName, email, password }) => ({
  fullName: normalizeFullName(fullName),
  email: normalizeEmail(email),
  password: normalizePassword(password),
});
