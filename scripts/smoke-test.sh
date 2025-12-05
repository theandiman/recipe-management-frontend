#!/bin/bash

# Smoke tests for deployed application
# Usage: ./scripts/smoke-test.sh [URL]
# Example: ./scripts/smoke-test.sh https://recipe-mgmt-dev.web.app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to dev environment if no URL provided
URL="${1:-https://recipe-mgmt-dev.web.app}"

echo -e "${BLUE}🧪 Running smoke tests against: $URL${NC}"
echo ""

# Test counter
PASSED=0
FAILED=0

# Helper functions
pass() {
  echo -e "${GREEN}✅ $1${NC}"
  ((PASSED++))
}

fail() {
  echo -e "${RED}❌ $1${NC}"
  ((FAILED++))
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test 1: Homepage accessibility
echo "Test 1: Homepage accessibility"
response=$(curl -s -o /dev/null -w "%{http_code}" "$URL/" || echo "000")
if [ "$response" = "200" ]; then
  pass "Homepage is accessible (HTTP $response)"
else
  fail "Homepage returned status code: $response"
fi
echo ""

# Test 2: Static assets
echo "Test 2: Static assets"
homepage=$(curl -s "$URL/" || echo "")
if [ -z "$homepage" ]; then
  fail "Could not fetch homepage content"
else
  if echo "$homepage" | grep -q "src=\"/assets/index-"; then
    pass "Main JS bundle reference found"
  else
    fail "Main JS bundle not found in homepage"
  fi
  
  if echo "$homepage" | grep -q "rel=\"stylesheet\""; then
    pass "Stylesheet reference found"
  else
    fail "Stylesheet not found in homepage"
  fi
fi
echo ""

# Test 3: Firebase SDK
echo "Test 3: Firebase configuration"
if echo "$homepage" | grep -qi "firebase"; then
  pass "Firebase SDK detected"
else
  warn "Firebase SDK not detected in initial HTML"
fi
echo ""

# Test 4: Performance
echo "Test 4: Performance check"
start_time=$(date +%s%N)
curl -s -o /dev/null "$URL/" 2>/dev/null || true
end_time=$(date +%s%N)

duration=$(( (end_time - start_time) / 1000000 ))
info "Homepage load time: ${duration}ms"

if [ "$duration" -gt 5000 ]; then
  warn "Homepage took longer than 5s to load"
else
  pass "Homepage load time is acceptable"
fi
echo ""

# Test 5: Security headers
echo "Test 5: Security headers"
headers=$(curl -s -I "$URL/" 2>/dev/null || echo "")
if [ -z "$headers" ]; then
  fail "Could not fetch headers"
else
  if echo "$headers" | grep -iq "x-frame-options\|content-security-policy"; then
    pass "Security headers present"
  else
    info "Consider adding security headers (X-Frame-Options, CSP)"
  fi
  
  if echo "$headers" | grep -q "HTTP/2 200"; then
    pass "Using HTTP/2"
  elif echo "$headers" | grep -q "HTTP/1.1 200"; then
    pass "HTTPS connection established"
  else
    warn "Could not verify HTTPS/HTTP2 connection"
  fi
fi
echo ""

# Test 6: Common routes
echo "Test 6: Common routes accessibility"
routes=("/recipes" "/ai-generator")
for route in "${routes[@]}"; do
  route_response=$(curl -s -o /dev/null -w "%{http_code}" "$URL$route" || echo "000")
  if [ "$route_response" = "200" ]; then
    pass "Route $route is accessible"
  else
    info "Route $route returned: $route_response (may redirect to login)"
  fi
done
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED${NC}"
else
  echo -e "Failed: $FAILED"
fi
echo ""

if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
else
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
fi
