#!/bin/bash
set -e

echo "Waiting for Oracle database to be ready..."
for i in {1..60}; do
  if sqlplus -s / as sysdba <<EOF
SELECT 1 FROM dual;
EXIT;
EOF
  then
    echo "Oracle is ready!"
    break
  fi
  echo "Attempt $i: Oracle not ready yet, waiting..."
  sleep 10
done

echo "Running database provisioning scripts..."

# Provision MAHALDB schema
sqlplus / as sysdba @/scripts/01_provision_mahaldb.sql

# Enable REST APIs
sqlplus / as sysdba @/scripts/02_enable_rest_mahaldb.sql

# Seed lookup data
sqlplus / as sysdba @/scripts/03_seed_mahaldb.sql

# Seed reviews
sqlplus / as sysdba @/scripts/04_seed_reviews.sql

echo "Database provisioning complete!"
