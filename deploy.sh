#!/usr/bin/env bash

set -eE

if ! sudo echo "Building..."; then
    echo "Needs sudo."
    exit 1
fi

yarn install

tmp_trash=/tmp/recipe-creator-previous-deployment
sudo rm -rf "$tmp_trash"
mkdir "$tmp_trash"

yarn build

sudo mv /opt/gfcooking/* "$tmp_trash" 2>/dev/null || true
sudo cp -Rv build/* /opt/gfcooking
echo
echo "Deployed to /opt/gfcooking."
echo "Previous deployment moved to $tmp_trash"

