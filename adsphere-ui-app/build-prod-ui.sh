#!/bin/bash

IMAGE_NAME="adsphere-ui-app"
PROJECT_PATH="/mnt/data/deploy/adsphere-ui-app"
VOLUME_NAME="adsphere_ui_dist"

VERSION="1.0.5"

echo "Building $IMAGE_NAME:$VERSION from $PROJECT_PATH"

docker build -t "$IMAGE_NAME:$VERSION" "$PROJECT_PATH"

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Build complete: $IMAGE_NAME:$VERSION"

# Extrage fișierele din imagine în volumul Docker
echo "Copying dist files to Docker volume $VOLUME_NAME..."

# Creează un container temporar din imagine, copiază din /app/dist/adsphere-ui-app în volum
docker run --rm \
  -v ${VOLUME_NAME}:/target \
  $IMAGE_NAME:$VERSION \
  bash -c "cp -r /app/dist/* /target/"

if [ $? -eq 0 ]; then
    echo "Copied UI build to Docker volume $VOLUME_NAME!"
else
    echo "Copy failed!"
    exit 1
fi
