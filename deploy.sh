#!/usr/bin/env bash

if ! sudo echo "Building..."; then
    echo "Needs sudo."
    exit 1
fi

tmp_trash=/tmp/recipe-creator-previous-deployment
mkdir -p "$tmp_trash"
if ! yarn build; then
    exit 1
fi

sudo mv /var/www/html/* "$tmp_trash"
sudo cp -Rv build/* /var/www/html
echo
echo "Deployed to /var/www/html."
echo "Previous deployment moved to $tmp_trash"

