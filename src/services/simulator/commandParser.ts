import { ParsedCommand } from '@/types/simulator';

/**
 * Tokenizes a raw command string while preserving quoted arguments ('...' and "...").
 */
export function tokenizeCommand(input: string): { tokens: string[]; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { tokens: [] };

  const tokens: string[] = [];
  let currentToken = '';
  let inDoubleQuote = false;
  let inSingleQuote = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue; // exclude quote character from token content
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue; // exclude quote character from token content
    }

    if ((char === ' ' || char === '\t') && !inDoubleQuote && !inSingleQuote) {
      if (currentToken.length > 0) {
        tokens.push(currentToken);
        currentToken = '';
      }
      continue;
    }

    currentToken += char;
  }

  if (inDoubleQuote || inSingleQuote) {
    return {
      tokens: [],
      error: 'syntax error: unclosed quotation mark',
    };
  }

  if (currentToken.length > 0) {
    tokens.push(currentToken);
  }

  return { tokens };
}

/**
 * Parses raw input string into a structured ParsedCommand representation.
 */
export function parseCommandLine(rawInput: string): { parsed?: ParsedCommand; error?: string } {
  const { tokens, error } = tokenizeCommand(rawInput);
  if (error) return { error };
  if (tokens.length === 0) return {};

  const program = tokens[0].toLowerCase();
  let subcommand: string | undefined;
  const flags: Record<string, string | boolean> = {};
  const positionalArgs: string[] = [];

  let startIndex = 1;

  if (program === 'git') {
    if (tokens.length > 1) {
      subcommand = tokens[1].toLowerCase();
      startIndex = 2;
    }
  }

  for (let i = startIndex; i < tokens.length; i++) {
    const token = tokens[i];

    // Handle flag with value attached: e.g. -m"My message" or -m="My message"
    if (token.startsWith('-m') && token.length > 2) {
      const val = token.startsWith('-m=') ? token.slice(3) : token.slice(2);
      flags['m'] = val;
      continue;
    }

    // Flag requiring next token as value: -m <msg>, -c <branch>, -b <branch>, -u <remote>
    if (token === '-m') {
      if (i + 1 < tokens.length) {
        flags['m'] = tokens[i + 1];
        i++;
      } else {
        return { error: 'error: switch `m` requires a value' };
      }
      continue;
    }

    if (token === '-c' || token === '-b') {
      const flagKey = token.slice(1);
      if (i + 1 < tokens.length) {
        flags[flagKey] = tokens[i + 1];
        i++;
      } else {
        return { error: `error: switch \`${flagKey}\` requires a value` };
      }
      continue;
    }

    // Combined short flags like -am "msg"
    if (token === '-am') {
      flags['a'] = true;
      if (i + 1 < tokens.length) {
        flags['m'] = tokens[i + 1];
        i++;
      } else {
        return { error: 'error: switch `m` requires a value' };
      }
      continue;
    }

    // Standalone flags: boolean flags
    if (token.startsWith('--')) {
      const flagName = token.slice(2);
      if (flagName.includes('=')) {
        const [k, v] = flagName.split('=');
        flags[k] = v;
      } else {
        flags[flagName] = true;
      }
      continue;
    }

    if (token.startsWith('-')) {
      const flagName = token.slice(1);
      flags[flagName] = true;
      continue;
    }

    // Positional argument
    positionalArgs.push(token);
  }

  return {
    parsed: {
      raw: rawInput,
      program,
      subcommand,
      flags,
      positionalArgs,
    },
  };
}
