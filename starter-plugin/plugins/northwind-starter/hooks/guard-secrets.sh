#!/usr/bin/env bash
# PreToolUse guardrail: deny any Read/Edit/Write/Bash call that touches a
# secrets file. Dependency-free on purpose (no jq/python): it pattern-matches
# the raw tool-call JSON on stdin.
# shortcut: a regex over JSON can be fooled by an obfuscated path; the managed
# deny rules are the real control, this hook is the second line.
input="$(cat)"
# .env.example and .env.sample are documentation, not secrets.
scrubbed="$(printf '%s' "$input" | sed -E 's/\.env\.(example|sample)//g')"
if printf '%s' "$scrubbed" | grep -Eq '(\.env(\.[A-Za-z0-9_-]+)?|id_rsa|id_ed25519|\.pem|\.p12|secrets/|credentials\.json)("|[[:space:]]|$|;|\||&)'; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Blocked by the northwind-starter secrets guardrail: this call touches a secrets file (.env, keys, credentials). Ask a human to provide the non-secret value you need."}}
JSON
fi
exit 0
