// --- AI prompt templates for jq playground ---

const MAX_INPUT_SAMPLE_LENGTH = 500;

const truncateInput = (input?: string): string | undefined => {
  if (!input) {
    return undefined;
  }
  return input.length > MAX_INPUT_SAMPLE_LENGTH
    ? `${input.slice(0, MAX_INPUT_SAMPLE_LENGTH)}…`
    : input;
};

export const buildExplainPrompt = (filter: string, input?: string): string => {
  const inputSample = truncateInput(input);
  return `You are a jq expert. Explain clearly what this jq filter does, step by step.
Mention which jq builtins are used and why. Be concise and practical.

Filter: ${filter}${inputSample ? `\n\nSample input (first ${MAX_INPUT_SAMPLE_LENGTH} chars):\n${inputSample}` : ""}`;
};

export const buildFixPrompt = (
  filter: string,
  error: string,
  input?: string
): string => {
  const inputSample = truncateInput(input);
  return `You are a jq expert. The following jq filter produced an error.
Explain WHY the error occurred in simple terms, then provide the corrected filter.

Filter: ${filter}
Error: ${error}${inputSample ? `\n\nInput JSON (sample):\n${inputSample}` : ""}

Format your response as:

## Why this error occurred
<explanation>

## Corrected filter
\`\`\`jq
<corrected filter>
\`\`\``;
};

export const buildGeneratePrompt = (
  description: string,
  jsonSample?: string
): string => {
  const inputSample = truncateInput(jsonSample);
  return `You are a jq expert. Generate a jq filter that performs this operation:
"${description}"${inputSample ? `\n\nThe input JSON looks like this:\n${inputSample}` : ""}

Return ONLY the jq filter expression, no explanation, no backticks, no markdown.
The filter must be valid jq syntax.`;
};

export const buildChatSystemPrompt = (
  activeFilter?: string,
  activeInput?: string
): string => {
  const inputSample = truncateInput(activeInput);
  return `You are a jq expert integrated in VS Code. Answer concisely.${activeFilter ? `\nCurrent filter in editor: ${activeFilter}` : ""}${inputSample ? `\nCurrent input (sample): ${inputSample}` : ""}`;
};
