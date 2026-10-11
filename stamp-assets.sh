#!/bin/sh
# Adds a content fingerprint (?v=...) to the CSS/JS links in index.html so browsers
# fetch fresh copies after every deploy instead of mixing old and new files.
# Run before committing a deploy:  ./stamp-assets.sh
set -e
cd "$(dirname "$0")"
for f in styles.css data.js app.js; do
  v=$(shasum "$f" | cut -c1-10)
  sed -i.bak -E "s#(href|src)=\"$f(\?v=[a-f0-9]+)?\"#\1=\"$f?v=$v\"#" index.html
done
rm -f index.html.bak
grep -oE '(styles\.css|data\.js|app\.js)\?v=[a-f0-9]+' index.html
