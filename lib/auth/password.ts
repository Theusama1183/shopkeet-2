// Password validation utilities

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strength: "weak" | "medium" | "strong" = "weak";

  // Minimum length check
  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Special character check
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Common password check
  if (isCommonPassword(password)) {
    errors.push("This password is too common. Please choose a more unique password");
  }

  // Calculate strength
  if (errors.length === 0) {
    if (password.length >= 16 && /[^a-zA-Z0-9].*[^a-zA-Z0-9]/.test(password)) {
      strength = "strong";
    } else if (password.length >= 12) {
      strength = "medium";
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

// Check for common weak passwords
const COMMON_PASSWORDS = [
  "password123",
  "123456789",
  "qwerty123",
  "password1",
  "admin123",
  "letmein123",
];

export function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return COMMON_PASSWORDS.some((common) => lowerPassword.includes(common));
}
