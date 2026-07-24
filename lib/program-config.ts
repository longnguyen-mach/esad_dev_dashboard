/** Top-level dashboard title / program lead shown in the hero header. */
export type ProgramConfig = {
  dashboardName: string;
  programLead: string;
};

export const DEFAULT_PROGRAM_CONFIG: ProgramConfig = {
  dashboardName: "MACH ESAD Development Dashboard",
  programLead: "Engineering Program Office",
};

export const PROGRAM_CONFIG_FIELD_LABELS = [
  "Dashboard Name",
  "Lead",
] as const;

export type ProgramConfigFieldLabel =
  (typeof PROGRAM_CONFIG_FIELD_LABELS)[number];

export function formatProgramConfigText(config: ProgramConfig): string {
  return [
    `Dashboard Name: "${config.dashboardName}"`,
    `Lead: "${config.programLead}"`,
  ].join("\n");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findFieldLine(
  text: string,
  label: ProgramConfigFieldLabel,
): { line: string; lineNumber: number } | null {
  const lines = text.split(/\r?\n/);
  const pattern = new RegExp(`^\\s*${escapeRegExp(label)}\\s*:`, "i");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (pattern.test(line)) {
      return { line, lineNumber: index + 1 };
    }
  }
  return null;
}

/** Validate Dashboard Configuration quote syntax. */
export function validateProgramConfigSyntax(text: string): string[] {
  const errors: string[] = [];

  for (const label of PROGRAM_CONFIG_FIELD_LABELS) {
    const found = findFieldLine(text, label);
    if (!found) {
      errors.push(`Syntax error: missing ${label}: "value"`);
      continue;
    }

    const { line, lineNumber } = found;
    const quoted = line.match(
      new RegExp(`^\\s*${escapeRegExp(label)}\\s*:\\s*"([^"]*)"\\s*$`, "i"),
    );
    if (quoted) continue;

    const opensQuote = line.match(
      new RegExp(`^\\s*${escapeRegExp(label)}\\s*:\\s*"`, "i"),
    );
    if (opensQuote) {
      errors.push(
        `Syntax error on line ${lineNumber}: ${label} is missing a closing "`,
      );
      continue;
    }

    const bareValue = line.match(
      new RegExp(`^\\s*${escapeRegExp(label)}\\s*:\\s*(.+)\\s*$`, "i"),
    );
    if (bareValue && bareValue[1].trim() !== "") {
      errors.push(
        `Syntax error on line ${lineNumber}: ${label} value must be inside " "`,
      );
      continue;
    }

    errors.push(
      `Syntax error on line ${lineNumber}: ${label} must use ${label}: "value"`,
    );
  }

  return errors;
}

function readQuotedField(
  text: string,
  label: ProgramConfigFieldLabel,
): string | null {
  const found = findFieldLine(text, label);
  if (!found) return null;
  const match = found.line.match(
    new RegExp(`^\\s*${escapeRegExp(label)}\\s*:\\s*"([^"]*)"\\s*$`, "i"),
  );
  return match ? match[1] : null;
}

export function parseProgramConfigText(
  text: string,
): { config: ProgramConfig } | { error: string; errors: string[] } {
  const syntaxErrors = validateProgramConfigSyntax(text);
  if (syntaxErrors.length > 0) {
    return { error: syntaxErrors[0] ?? "Syntax error", errors: syntaxErrors };
  }

  const dashboardName = readQuotedField(text, "Dashboard Name");
  const programLead = readQuotedField(text, "Lead");
  if (dashboardName == null || programLead == null) {
    return {
      error: 'Syntax error: each field must use Label: "value"',
      errors: ['Syntax error: each field must use Label: "value"'],
    };
  }

  const valueErrors: string[] = [];
  if (!dashboardName.trim()) {
    valueErrors.push("Dashboard Name cannot be empty.");
  }
  if (!programLead.trim()) {
    valueErrors.push("Lead cannot be empty.");
  }
  if (valueErrors.length > 0) {
    return {
      error: valueErrors[0] ?? "Invalid configuration",
      errors: valueErrors,
    };
  }

  return {
    config: {
      dashboardName: dashboardName.trim(),
      programLead: programLead.trim(),
    },
  };
}
