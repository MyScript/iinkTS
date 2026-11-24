/**
 * @group Constants
 * @remarks Human-readable messages for MathDiagnostic error codes
 */
export const MathDiagnosticMessages: {
  [key: string]: {
    title: string
    message: string
    severity: "success" | "warning" | "error" | "info"
  }
} = {
  ALLOWED: {
    title: "Task Allowed",
    message: "The mathematical task can be performed successfully.",
    severity: "success",
  },
  ALLOWED_BUT_PREVIOUSLY_DISCARDED: {
    title: "Previously Discarded",
    message: "The task is allowed, but you previously discarded the result. The system can recompute it if needed.",
    severity: "warning",
  },
  UNSUPPORTED: {
    title: "Unsupported Task",
    message:
      "This task is not supported due to an internal error. Please try a different operation or contact support.",
    severity: "error",
  },
  NON_EVALUABLE: {
    title: "Non-Evaluable Expression",
    message: "The expression format cannot be evaluated. Please check the mathematical notation and try again.",
    severity: "error",
  },
  INCOMPLETE_EXPRESSION: {
    title: "Incomplete Expression",
    message:
      "The expression is incomplete. Please finish writing the mathematical expression before attempting to evaluate it.",
    severity: "warning",
  },
  NO_VARIABLE: {
    title: "No Variables Found",
    message: "There are no undefined variables to evaluate. This operation requires at least one variable.",
    severity: "info",
  },
  TOO_MANY_VARIABLES: {
    title: "Too Many Variables",
    message:
      "The expression contains too many undefined variables. Please define some variables or simplify the expression.",
    severity: "warning",
  },
  NOT_APPLICABLE: {
    title: "Not Applicable",
    message: "This task does not apply to the current expression or configuration. No action is needed.",
    severity: "info",
  },
  DIVISION_BY_ZERO: {
    title: "Division by Zero",
    message:
      "The computation results in a division by zero, which is mathematically undefined. Please modify the expression or variable values.",
    severity: "error",
  },
  NUMBER_OVERFLOW: {
    title: "Number Overflow",
    message: "The computation results in a number that is too large to represent. Try using smaller values.",
    severity: "error",
  },
  NUMBER_UNDERFLOW: {
    title: "Number Underflow",
    message: "The computation results in a number that is too small to represent. Try using larger values.",
    severity: "error",
  },
  INVALID_OPERATION: {
    title: "Invalid Operation",
    message: "The computation leads to an invalid mathematical operation. Please check the expression and try again.",
    severity: "error",
  },
}

/**
 * @group Constants
 * @summary Get diagnostic message for a given diagnostic code
 * @param diagnostic - The diagnostic code (e.g., "ALLOWED", "DIVISION_BY_ZERO")
 * @returns Message object with title, message, and severity
 */
export function getMathDiagnosticMessage(diagnostic: string): {
  title: string
  message: string
  severity: "success" | "warning" | "error" | "info"
} {
  return (
    MathDiagnosticMessages[diagnostic] || {
      title: "Unknown Diagnostic",
      message: `Unknown diagnostic code: ${diagnostic}`,
      severity: "info",
    }
  )
}
