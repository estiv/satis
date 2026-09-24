#!/bin/bash
set -e
HT=/home/hundaft1/public_html/.htaccess
MARKER_BEGIN='# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN'
MARKER_END='# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END'

# Remove old passenger block if present
if grep -q "CLOUDLINUX PASSENGER CONFIGURATION BEGIN" "$HT" 2>/dev/null; then
  tmp=$(mktemp)
  awk -v b="$MARKER_BEGIN" -v e="$MARKER_END" '
    $0==b {skip=1; next}
    $0==e {skip=0; next}
    !skip {print}
  ' "$HT" > "$tmp"
  mv "$tmp" "$HT"
fi

cat >> "$HT" <<'EOF'

# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/hundaft1/satis"
PassengerBaseURI "/"
PassengerNodejs "/home/hundaft1/nodevenv/satis/22/bin/node"
PassengerAppType node
PassengerStartupFile server.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
EOF

echo "Wrote Passenger config to $HT"
grep -n Passenger "$HT"
touch /home/hundaft1/satis/tmp/restart.txt
cloudlinux-selector restart --json --interpreter nodejs --app-root /home/hundaft1/satis || true
echo DONE
