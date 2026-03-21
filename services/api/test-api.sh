#!/usr/bin/env bash
# API integration test script — uses curl to test all implemented endpoints

BASE_URL="http://localhost:3001"
COOKIE_JAR="/tmp/test-cookies.txt"
PASS=0
FAIL=0

# ── Color helpers ─────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}✓ PASS${NC} $1"; ((PASS++)); }
fail() { echo -e "${RED}✗ FAIL${NC} $1"; echo -e "       Response: $2"; ((FAIL++)); }
section() { echo -e "\n${YELLOW}── $1 ──${NC}"; }

# ── Helper: make a request and return status + body ──────────────────────────
# Usage: request METHOD PATH [EXTRA_CURL_ARGS...]
# Sets $STATUS and $BODY
request() {
  local method=$1
  local path=$2
  shift 2
  local response
  response=$(curl -s -w "\n%{http_code}" \
    -X "$method" \
    "$@" \
    "$BASE_URL$path")
  STATUS=$(echo "$response" | tail -n1)
  BODY=$(echo "$response" | sed '$d')
}

# ── Clean up cookie jar ───────────────────────────────────────────────────────
rm -f "$COOKIE_JAR"

# ═══════════════════════════════════════════════════════════════════════════════
section "Health Check"
# ═══════════════════════════════════════════════════════════════════════════════

request GET /health
if [ "$STATUS" = "200" ]; then
  pass "GET /health → 200"
else
  fail "GET /health → expected 200, got $STATUS" "$BODY"
fi

# ═══════════════════════════════════════════════════════════════════════════════
section "Auth — Register"
# ═══════════════════════════════════════════════════════════════════════════════

# Use a timestamp-based email to avoid conflicts across test runs
TEST_EMAIL="testuser_$$@example.com"
TEST_PASSWORD="Password123"

# Happy path: new user registers successfully
request POST /auth/register \
  -H "Content-Type: application/json" \
  --cookie-jar "$COOKIE_JAR" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
if [ "$STATUS" = "201" ]; then
  pass "POST /auth/register (new user) → 201"
  # Extract access token for later use
  ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
  fail "POST /auth/register (new user) → expected 201, got $STATUS" "$BODY"
fi

# Error: duplicate email
request POST /auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
if [ "$STATUS" = "409" ]; then
  pass "POST /auth/register (duplicate email) → 409"
else
  fail "POST /auth/register (duplicate email) → expected 409, got $STATUS" "$BODY"
fi

# Error: missing required fields (no firstName)
request POST /auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"other@example.com\",\"password\":\"Password123\",\"lastName\":\"User\"}"
if [ "$STATUS" = "400" ]; then
  pass "POST /auth/register (missing fields) → 400"
else
  fail "POST /auth/register (missing fields) → expected 400, got $STATUS" "$BODY"
fi

# Error: password too short (less than 8 chars)
request POST /auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"short@example.com\",\"password\":\"abc\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
if [ "$STATUS" = "400" ]; then
  pass "POST /auth/register (short password) → 400"
else
  fail "POST /auth/register (short password) → expected 400, got $STATUS" "$BODY"
fi

# ═══════════════════════════════════════════════════════════════════════════════
section "Auth — Login"
# ═══════════════════════════════════════════════════════════════════════════════

# Happy path: correct credentials
request POST /auth/login \
  -H "Content-Type: application/json" \
  --cookie-jar "$COOKIE_JAR" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
if [ "$STATUS" = "200" ]; then
  pass "POST /auth/login (correct credentials) → 200"
  ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
  fail "POST /auth/login (correct credentials) → expected 200, got $STATUS" "$BODY"
fi

# Error: wrong password
request POST /auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}"
if [ "$STATUS" = "401" ]; then
  pass "POST /auth/login (wrong password) → 401"
else
  fail "POST /auth/login (wrong password) → expected 401, got $STATUS" "$BODY"
fi

# Error: non-existent user (same 401 to avoid user enumeration)
request POST /auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"nobody@example.com\",\"password\":\"Password123\"}"
if [ "$STATUS" = "401" ]; then
  pass "POST /auth/login (non-existent user) → 401"
else
  fail "POST /auth/login (non-existent user) → expected 401, got $STATUS" "$BODY"
fi

# Error: missing password field
request POST /auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}"
if [ "$STATUS" = "400" ]; then
  pass "POST /auth/login (missing password) → 400"
else
  fail "POST /auth/login (missing password) → expected 400, got $STATUS" "$BODY"
fi

# ═══════════════════════════════════════════════════════════════════════════════
section "Auth — Refresh Token"
# ═══════════════════════════════════════════════════════════════════════════════

# Happy path: valid refresh token cookie → new access token
request POST /auth/refresh \
  --cookie "$COOKIE_JAR" \
  --cookie-jar "$COOKIE_JAR"
if [ "$STATUS" = "200" ]; then
  pass "POST /auth/refresh (valid cookie) → 200"
  ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
  fail "POST /auth/refresh (valid cookie) → expected 200, got $STATUS" "$BODY"
fi

# Error: no refresh token cookie
request POST /auth/refresh
if [ "$STATUS" = "401" ]; then
  pass "POST /auth/refresh (no cookie) → 401"
else
  fail "POST /auth/refresh (no cookie) → expected 401, got $STATUS" "$BODY"
fi

# ═══════════════════════════════════════════════════════════════════════════════
section "Products — List"
# ═══════════════════════════════════════════════════════════════════════════════

# Happy path: default params
request GET /products
if [ "$STATUS" = "200" ]; then
  pass "GET /products (default) → 200"
  # Check response has expected fields
  if echo "$BODY" | grep -q '"products"' && echo "$BODY" | grep -q '"pagination"'; then
    pass "GET /products response has 'products' and 'pagination' fields"
  else
    fail "GET /products response missing expected fields" "$BODY"
  fi
else
  fail "GET /products (default) → expected 200, got $STATUS" "$BODY"
fi

# Category filter
request GET "/products?category=women"
if [ "$STATUS" = "200" ]; then
  pass "GET /products?category=women → 200"
else
  fail "GET /products?category=women → expected 200, got $STATUS" "$BODY"
fi

# Pagination
request GET "/products?page=2&limit=5"
if [ "$STATUS" = "200" ]; then
  pass "GET /products?page=2&limit=5 → 200"
else
  fail "GET /products?page=2&limit=5 → expected 200, got $STATUS" "$BODY"
fi

# Error: limit exceeds max (100)
request GET "/products?limit=101"
if [ "$STATUS" = "400" ]; then
  pass "GET /products?limit=101 (over max) → 400"
else
  fail "GET /products?limit=101 (over max) → expected 400, got $STATUS" "$BODY"
fi

# Error: invalid page (non-integer)
request GET "/products?page=abc"
if [ "$STATUS" = "400" ]; then
  pass "GET /products?page=abc (invalid page) → 400"
else
  fail "GET /products?page=abc (invalid page) → expected 400, got $STATUS" "$BODY"
fi

# ═══════════════════════════════════════════════════════════════════════════════
section "Products — Single Product"
# ═══════════════════════════════════════════════════════════════════════════════

# Error: product that doesn't exist
request GET "/products/this-slug-does-not-exist-xyz"
if [ "$STATUS" = "404" ]; then
  pass "GET /products/:slug (non-existent) → 404"
else
  fail "GET /products/:slug (non-existent) → expected 404, got $STATUS" "$BODY"
fi

# Note: happy path for a real slug requires a product in the database.
# If there are products, grab a slug from the list endpoint and test it.
FIRST_SLUG=$(curl -s "$BASE_URL/products?limit=1" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$FIRST_SLUG" ]; then
  request GET "/products/$FIRST_SLUG"
  if [ "$STATUS" = "200" ]; then
    pass "GET /products/$FIRST_SLUG (real slug) → 200"
  else
    fail "GET /products/$FIRST_SLUG (real slug) → expected 200, got $STATUS" "$BODY"
  fi
else
  echo -e "  ${YELLOW}⚠ SKIP${NC} GET /products/:slug (no products in DB to test with)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
section "Auth — Logout"
# ═══════════════════════════════════════════════════════════════════════════════

# Happy path: logout clears cookie
request POST /auth/logout \
  --cookie "$COOKIE_JAR" \
  --cookie-jar "$COOKIE_JAR"
if [ "$STATUS" = "200" ]; then
  pass "POST /auth/logout (with valid cookie) → 200"
else
  fail "POST /auth/logout (with valid cookie) → expected 200, got $STATUS" "$BODY"
fi

# Verify: refresh token is now invalid after logout
request POST /auth/refresh \
  --cookie "$COOKIE_JAR"
if [ "$STATUS" = "401" ]; then
  pass "POST /auth/refresh after logout → 401 (token revoked)"
else
  fail "POST /auth/refresh after logout → expected 401, got $STATUS" "$BODY"
fi

# Logout with no cookie should still return 200 (graceful)
request POST /auth/logout
if [ "$STATUS" = "200" ]; then
  pass "POST /auth/logout (no cookie) → 200"
else
  fail "POST /auth/logout (no cookie) → expected 200, got $STATUS" "$BODY"
fi

# ═══════════════════════════════════════════════════════════════════════════════
section "404 Route"
# ═══════════════════════════════════════════════════════════════════════════════

request GET /nonexistent-route
if [ "$STATUS" = "404" ]; then
  pass "GET /nonexistent-route → 404"
else
  fail "GET /nonexistent-route → expected 404, got $STATUS" "$BODY"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════"
TOTAL=$((PASS + FAIL))
echo -e "Results: ${GREEN}$PASS passed${NC} / ${RED}$FAIL failed${NC} / $TOTAL total"
echo "════════════════════════════════════"

# Clean up
rm -f "$COOKIE_JAR"

# Exit with non-zero if any failures
[ "$FAIL" -eq 0 ]
