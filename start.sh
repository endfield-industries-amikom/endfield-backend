#!/bin/bash

# Start the database compose using podman
podman-compose -f docker-compose-db.yaml up -d

# Start the backend server
npm run start:dev
