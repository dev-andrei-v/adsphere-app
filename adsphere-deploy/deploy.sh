#!/bin/bash

echo "Stopping current containers..."
docker compose down

echo "Starting containers in detached mode..."
docker compose up -d

# Wait 2 seconds for the containers to start
sleep 2
echo "Restarting adsphere-backend container..."
docker restart adsphere-backend

sleep 2
echo "Restarting adsphere-ai container..."
docker restart adsphere-ai

echo "Deployment complete."
