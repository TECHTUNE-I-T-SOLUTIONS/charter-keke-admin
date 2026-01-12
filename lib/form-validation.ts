/**
 * Form Validation Utilities for Charter Keke Signup
 */

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format (supports Nigerian format)
 */
export function validatePhone(phone: string): boolean {
  // Accept +234, 0234, 234 formats and basic validation
  const phoneRegex = /^(\+234|0|234)[0-9]{9,10}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ""));
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates plate number format
 */
export function validatePlateNumber(plate: string): boolean {
  // Nigerian plate format: ABC 123 XY or similar variations
  const plateRegex = /^[A-Z]{1,3}\s?\d{1,4}\s?[A-Z]{2}$/;
  return plateRegex.test(plate.toUpperCase().trim());
}

/**
 * Validates bank account number (basic check)
 */
export function validateBankAccount(accountNumber: string): boolean {
  // Most Nigerian banks use 10-digit account numbers
  return /^\d{10}$/.test(accountNumber.trim());
}

/**
 * Validates NUBAN format (Nigerian Universal Bank Account Number)
 */
export function validateNUBAN(nuban: string): boolean {
  // NUBAN is 10 digits
  if (!/^\d{10}$/.test(nuban)) {
    return false;
  }

  // Checksum validation
  const weights = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3];
  let sum = 0;

  for (let i = 0; i < nuban.length; i++) {
    sum += parseInt(nuban[i]) * weights[i];
  }

  return sum % 11 === 0;
}

/**
 * Validates date of birth
 */
export function validateDOB(dateString: string): {
  isValid: boolean;
  isMinimumAge: boolean;
  minimumAge: number;
} {
  const minimumAge = 18;
  const dob = new Date(dateString);
  const today = new Date();

  // Check if date is valid
  if (isNaN(dob.getTime())) {
    return {
      isValid: false,
      isMinimumAge: false,
      minimumAge,
    };
  }

  // Check if date is not in the future
  if (dob > today) {
    return {
      isValid: false,
      isMinimumAge: false,
      minimumAge,
    };
  }

  // Check minimum age
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return {
    isValid: true,
    isMinimumAge: age >= minimumAge,
    minimumAge,
  };
}

/**
 * Validates file for upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in MB
    allowedTypes?: string[];
  } = {}
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const maxSize = (options.maxSize || 5) * 1024 * 1024; // Default 5MB
  const allowedTypes = options.allowedTypes || [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  // Check file size
  if (file.size > maxSize) {
    errors.push(
      `File size must be less than ${options.maxSize || 5}MB`
    );
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(
      `File type must be one of: ${allowedTypes.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates vehicle plate format variations
 */
export function validateVehiclePlate(plate: string): {
  isValid: boolean;
  format: string;
} {
  const plate_upper = plate.toUpperCase().replace(/\s/g, "");

  // Format 1: ABC123XY (Lagos/Nigeria standard)
  if (/^[A-Z]{3}\d{3}[A-Z]{2}$/.test(plate_upper)) {
    return { isValid: true, format: "ABC123XY" };
  }

  // Format 2: ABC12XY (alternative)
  if (/^[A-Z]{3}\d{2}[A-Z]{2}$/.test(plate_upper)) {
    return { isValid: true, format: "ABC12XY" };
  }

  // Format 3: AB123CDE (alternative)
  if (/^[A-Z]{2}\d{3}[A-Z]{3}$/.test(plate_upper)) {
    return { isValid: true, format: "AB123CDE" };
  }

  return { isValid: false, format: "unknown" };
}

/**
 * Sanitizes input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, (char) => {
      const map: { [key: string]: string } = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "&": "&amp;",
      };
      return map[char];
    });
}

/**
 * Validates form data before submission
 */
export function validateSignupForm(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dob?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  vehicleType?: string;
  plateNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
}): {
  isValid: boolean;
  errors: { [key: string]: string[] };
} {
  const errors: { [key: string]: string[] } = {};

  // Basic fields
  if (!data.firstName?.trim()) {
    errors.firstName = ["First name is required"];
  }
  if (!data.lastName?.trim()) {
    errors.lastName = ["Last name is required"];
  }

  if (!data.email?.trim()) {
    errors.email = ["Email is required"];
  } else if (!validateEmail(data.email)) {
    errors.email = ["Invalid email format"];
  }

  if (!data.phone?.trim()) {
    errors.phone = ["Phone number is required"];
  } else if (!validatePhone(data.phone)) {
    errors.phone = ["Invalid phone number format"];
  }

  // DOB validation (if provided)
  if (data.dob) {
    const dobValidation = validateDOB(data.dob);
    if (!dobValidation.isValid) {
      errors.dob = ["Invalid date of birth"];
    } else if (!dobValidation.isMinimumAge) {
      errors.dob = [`Must be at least ${dobValidation.minimumAge} years old`];
    }
  }

  // Password validation
  if (!data.password) {
    errors.password = ["Password is required"];
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors;
    }
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = ["Please confirm your password"];
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = ["Passwords do not match"];
  }

  // Driver-specific fields
  if (data.role === "driver") {
    if (!data.vehicleType) {
      errors.vehicleType = ["Vehicle type is required"];
    }

    if (!data.plateNumber?.trim()) {
      errors.plateNumber = ["Plate number is required"];
    } else {
      const plateValidation = validateVehiclePlate(data.plateNumber);
      if (!plateValidation.isValid) {
        errors.plateNumber = ["Invalid plate number format"];
      }
    }

    if (!data.bankName?.trim()) {
      errors.bankName = ["Bank name is required"];
    }

    if (!data.bankAccountNumber?.trim()) {
      errors.bankAccountNumber = ["Account number is required"];
    } else if (!validateBankAccount(data.bankAccountNumber)) {
      errors.bankAccountNumber = ["Invalid account number format"];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
