#!/bin/bash

IMAGE_NAME="adsphere-ai"
PROJECT_PATH="/mnt/data/deploy/adsphere-ai"

VERSION="1.0.5"

echo "Building $IMAGE_NAME:$VERSION from $PROJECT_PATH"

docker build -t "$IMAGE_NAME:$VERSION" "$PROJECT_PATH"

if [ $? -eq 0 ]; then
    echo "Build complete: $IMAGE_NAME:$VERSION"
else
    echo "Build failed!"
    exit 1
fi
