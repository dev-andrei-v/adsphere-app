#!/bin/bash

DOMAIN="adsphere.software"
EMAIL="EMAIL_ADDRESS_HERE"
ACME="/mnt/data/deploy/adsphere-deploy/acme"
CERTS="/mnt/data/deploy/adsphere-deploy/certs"

mkdir -p "$ACME"
mkdir -p "$CERTS"

docker run --rm \
  -v "$ACME:/var/www/certbot" \
  -v "$CERTS:/etc/letsencrypt" \
  certbot/certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d "$DOMAIN"
