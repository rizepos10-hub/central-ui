#!/bin/sh
set -eu

HTML_DIR="/usr/share/nginx/html"
API_URL="${SERVER_API_URL:-}"
ADMIN_API_URL="${SERVER_ADMIN_API_URL:-}"
SERVER_DOMAIN="${SERVER_DOMAIN:-https://pos-central.rize-pos.com}"
MAPS_KEY="${GOOGLE_MAPS_API_KEY:-}"
CENTRAL_UPSTREAM="${CENTRAL_SERVICE_HOST:-central.rize-pos-dev.svc.cluster.local}"
ADMIN_UPSTREAM="${ADMIN_SERVICE_HOST:-admin.rize-pos-dev.svc.cluster.local}"

sed -i "s|CENTRAL_UPSTREAM_HOST|${CENTRAL_UPSTREAM}|g" /etc/nginx/conf.d/default.conf
sed -i "s|ADMIN_UPSTREAM_HOST|${ADMIN_UPSTREAM}|g" /etc/nginx/conf.d/default.conf

cat > "${HTML_DIR}/env-config.js" <<EOF
window.__ENV__ = {
  SERVER_API_URL: "${API_URL}",
  SERVER_ADMIN_API_URL: "${ADMIN_API_URL}",
  SERVER_DOMAIN: "${SERVER_DOMAIN}",
  GOOGLE_MAPS_API_KEY: "${MAPS_KEY}",
  APP_ID: "central-app"
};
EOF

exec nginx -g 'daemon off;'
