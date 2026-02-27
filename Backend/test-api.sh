#!/bin/bash
DOMAIN="localhost"
TOKEN=$(curl -sX POST http://localhost:3000/auth/login -H "Content-Type: application/json" -H "custom-franchise-domain: $DOMAIN" -d '{"email":"aryanagupta.jecrc@gmail.com","password":"password"}' | jq -r .access_token)

echo "Got Token: $TOKEN"

curl -sX GET http://localhost:3000/mail/templates -H "Authorization: Bearer $TOKEN" -H "custom-franchise-domain: $DOMAIN" | jq .
