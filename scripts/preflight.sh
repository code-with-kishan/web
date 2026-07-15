#!/usr/bin/env bash
# preflight.sh — pre-submission audit for AI-judged hackathon repos.
# Run from the repo root: bash scripts/preflight.sh
# Exit code: 0 = all checks passed, 1 = at least one FAIL.

set -u
PASS=0; FAIL=0; WARN=0
EXCLUDES=(--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist \
  --exclude-dir=build --exclude-dir=coverage --exclude-dir=.next)

ok()   { printf '\033[32mPASS\033[0m  %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '\033[31mFAIL\033[0m  %s\n' "$1"; FAIL=$((FAIL+1)); }
warn() { printf '\033[33mWARN\033[0m  %s\n' "$1"; WARN=$((WARN+1)); }

echo "== promptwars-100 preflight =="

# ---------- 1. Repo hygiene ----------
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git ls-files | grep -qE '(^|/)\.env(\..*)?$' ; then
    if git ls-files | grep -E '(^|/)\.env(\..*)?$' | grep -vq '\.env\.example$'; then
      bad "a .env file is tracked by git — remove it and purge history"
    else
      ok ".env not tracked (only .env.example)"
    fi
  else
    ok "no .env files tracked"
  fi
  if git ls-files | grep -qE '(^|/)(node_modules|dist|build|coverage)/'; then
    bad "generated directories (node_modules/dist/build/coverage) are tracked"
  else
    ok "no generated directories tracked"
  fi
else
  warn "not a git repo — hygiene checks skipped"
fi

# ---------- 2. Secret patterns ----------
if grep -RInE "${EXCLUDES[@]}" \
  'AIza[0-9A-Za-z_-]{35}|sk-[A-Za-z0-9]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY' \
  . >/tmp/pf_secrets 2>/dev/null && [ -s /tmp/pf_secrets ]; then
  bad "possible hardcoded secrets:"; sed 's/^/      /' /tmp/pf_secrets | head -5
else
  ok "no hardcoded secret patterns found"
fi

# ---------- 3. Debug residue / quality tells (source dirs only) ----------
SRC_DIRS=""
for d in src app server api lib components; do [ -d "$d" ] && SRC_DIRS="$SRC_DIRS $d"; done
if [ -n "$SRC_DIRS" ]; then
  # shellcheck disable=SC2086
  if grep -RInE "${EXCLUDES[@]}" \
    'console\.log\(|debugger;|@ts-ignore|@ts-nocheck|\bas any\b|: any\b|TODO|FIXME|HACK' \
    $SRC_DIRS >/tmp/pf_debug 2>/dev/null && [ -s /tmp/pf_debug ]; then
    bad "$(wc -l < /tmp/pf_debug) quality-tell(s) (console.log / any / @ts-ignore / TODO):"
    sed 's/^/      /' /tmp/pf_debug | head -10
  else
    ok "no console.log / any / @ts-ignore / TODO in source"
  fi
  # Oversized files
  BIG=$(find $SRC_DIRS -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.py' \) \
        ! -path '*/node_modules/*' -exec awk 'END{if(NR>250)print FILENAME" ("NR" lines)"}' {} \; 2>/dev/null)
  if [ -n "$BIG" ]; then
    warn "files over 250 lines (judge samples these first):"; echo "$BIG" | sed 's/^/      /'
  else
    ok "no source file exceeds 250 lines"
  fi
else
  warn "no standard source dir (src/app/server) found — residue scan skipped"
fi

# ---------- 4. Required artifacts ----------
for f in README.md LICENSE .gitignore .env.example; do
  [ -f "$f" ] && ok "$f present" || bad "$f missing"
done
ls .github/workflows/*.yml >/dev/null 2>&1 && ok "CI workflow present" || bad "no .github/workflows/*.yml — CI is a top judge signal"
[ -f Dockerfile ] && ok "Dockerfile present" || warn "no Dockerfile (fine only if platform builds without one)"
[ -f SECURITY.md ] && ok "SECURITY.md present" || warn "SECURITY.md missing (cheap Security-metric evidence)"

# ---------- 5. README sections named after the metrics ----------
if [ -f README.md ]; then
  for sec in "Problem Statement" "Testing" "Security" "Performance" "Accessibility" "Architecture"; do
    grep -qiE "^#{1,3} .*${sec}" README.md && ok "README section: $sec" \
      || bad "README missing '## $sec' section (judge looks for it by name)"
  done
  grep -qiE 'https?://' README.md && ok "README contains a link (live demo)" \
    || bad "README has no URL — live demo link must be at the top"
  grep -qiE "^#{1,3} .*(Google Cloud|Google Services)" README.md \
    && ok "README section: Google Cloud Integration" \
    || warn "no 'Google Cloud Integration' README section (required on Google-sponsored events)"
fi

# ---------- 5b. Commit hygiene ----------
if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && [ "$(git rev-list --count HEAD 2>/dev/null || echo 0)" -gt 0 ]; then
  NONCONV=$(git log --format=%s -n 15 | grep -cvE '^(feat|fix|docs|test|chore|refactor|perf|ci|build|style)(\(.+\))?!?: ' || true)
  if [ "$NONCONV" -eq 0 ]; then ok "last 15 commits follow conventional commits"
  else warn "$NONCONV of last 15 commit messages are not conventional (judge reads git log)"; fi
fi

# ---------- 6. Toolchain gates ----------
run_script() { # $1 = npm script name, $2 = label
  if [ -f package.json ] && grep -q "\"$1\"" package.json; then
    if npm run --silent "$1" >/tmp/pf_out 2>&1; then ok "$2 passed"
    else bad "$2 FAILED:"; tail -8 /tmp/pf_out | sed 's/^/      /'; fi
  else warn "no \"$1\" script in package.json"; fi
}
if [ -f package.json ]; then
  run_script lint "npm run lint"
  run_script typecheck "npm run typecheck (tsc --noEmit)"
  run_script test:coverage "npm run test:coverage"
  if npm audit --omit=dev --audit-level=high >/tmp/pf_audit 2>&1; then
    ok "npm audit: no high/critical vulnerabilities"
  else
    bad "npm audit found high/critical issues:"; tail -6 /tmp/pf_audit | sed 's/^/      /'
  fi
elif [ -f pyproject.toml ]; then
  command -v ruff >/dev/null && { ruff check . >/dev/null 2>&1 && ok "ruff clean" || bad "ruff violations"; } || warn "ruff not installed"
  command -v mypy >/dev/null && { mypy . >/dev/null 2>&1 && ok "mypy clean" || bad "mypy errors"; } || warn "mypy not installed"
  command -v pytest >/dev/null && { pytest -q >/dev/null 2>&1 && ok "pytest passing" || bad "pytest failures"; } || warn "pytest not installed"
else
  warn "no package.json or pyproject.toml at repo root"
fi

# ---------- Summary ----------
echo "--------------------------------"
printf 'PASS %d · WARN %d · FAIL %d\n' "$PASS" "$WARN" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo "DO NOT SUBMIT — fix every FAIL, then re-run."
  exit 1
fi
echo "Preflight clean. Proceed to judge simulation (references/judge-model.md)."
exit 0
