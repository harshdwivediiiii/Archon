#!/bin/sh
set -e

node validate-env.js

exec node server.js
