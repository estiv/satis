#!/bin/bash
set -e
# Wire Passenger for satisrental.com only (addon domain docroot).
# Do NOT write into public_html — that belongs to hundaftrading.com.
HT=/home/hundaft1/satisrental.com/.htaccess

mkdir -p /home/hundaft1/satisrental.com

cat > "$HT" <<'EOF'
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerEnabled on
PassengerAppRoot "/home/hundaft1/satis"
PassengerBaseURI "/"
PassengerNodejs "/home/hundaft1/nodevenv/satis/22/bin/node"
PassengerAppType node
PassengerStartupFile server.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
EOF
chmod 644 "$HT"

echo "Wrote Passenger config to $HT"
grep -n Passenger "$HT"
mkdir -p /home/hundaft1/satis/tmp
touch /home/hundaft1/satis/tmp/restart.txt
cloudlinux-selector restart --json --interpreter nodejs --app-root /home/hundaft1/satis || true
echo DONE
