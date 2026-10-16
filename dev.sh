#!/bin/bash

set -e  # Exit on error

echo "Building package..."
npm run build

echo ""
echo "Build complete!"
echo ""
echo "Starting dev server..."
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8000 --directory .

