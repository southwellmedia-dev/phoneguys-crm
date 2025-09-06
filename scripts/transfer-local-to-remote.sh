#!/bin/bash

# Transfer Local Supabase Data to Remote
# This script exports data from your local Supabase instance and imports it to remote

echo "================================================"
echo "Local to Remote Supabase Data Transfer Script"
echo "================================================"

# Configuration
LOCAL_DB_HOST="127.0.0.1"
LOCAL_DB_PORT="54322"
LOCAL_DB_USER="postgres"
LOCAL_DB_PASSWORD="postgres"
LOCAL_DB_NAME="postgres"

# Remote configuration - Update these with your actual remote details
REMOTE_DB_URL="postgresql://postgres.egotypldqzdzjclikmeg:iZPi-8JYjn?0KtvY@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Function to show menu
show_menu() {
    echo ""
    echo "Select transfer option:"
    echo "1. Export ALL data (excluding auth and storage schemas)"
    echo "2. Export only user statistics and tracking data"
    echo "3. Export specific tables (interactive selection)"
    echo "4. Run statistics population SQL only (no data transfer)"
    echo "5. Exit"
    echo ""
    read -p "Enter your choice [1-5]: " choice
}

# Function to export all data
export_all_data() {
    echo "Exporting all data from local database..."
    
    pg_dump \
        --data-only \
        --no-owner \
        --no-privileges \
        --exclude-schema=auth \
        --exclude-schema=storage \
        --exclude-schema=extensions \
        --exclude-schema=pgbouncer \
        --exclude-schema=realtime \
        --exclude-schema=supabase_functions \
        --exclude-schema=supabase_migrations \
        -h $LOCAL_DB_HOST \
        -p $LOCAL_DB_PORT \
        -U $LOCAL_DB_USER \
        -d $LOCAL_DB_NAME \
        > local_data_dump.sql
    
    if [ $? -eq 0 ]; then
        echo "✓ Data exported successfully to local_data_dump.sql"
        import_to_remote "local_data_dump.sql"
    else
        echo "✗ Export failed"
        exit 1
    fi
}

# Function to export statistics data only
export_statistics_data() {
    echo "Exporting user statistics and tracking data..."
    
    TABLES=(
        "user_statistics"
        "user_activity_logs"
        "repair_tickets"
        "appointments"
        "ticket_notes"
        "ticket_time_logs"
    )
    
    TABLE_LIST=""
    for table in "${TABLES[@]}"; do
        TABLE_LIST="$TABLE_LIST -t public.$table"
    done
    
    pg_dump \
        --data-only \
        --no-owner \
        --no-privileges \
        $TABLE_LIST \
        -h $LOCAL_DB_HOST \
        -p $LOCAL_DB_PORT \
        -U $LOCAL_DB_USER \
        -d $LOCAL_DB_NAME \
        > statistics_data_dump.sql
    
    if [ $? -eq 0 ]; then
        echo "✓ Statistics data exported successfully to statistics_data_dump.sql"
        import_to_remote "statistics_data_dump.sql"
    else
        echo "✗ Export failed"
        exit 1
    fi
}

# Function to export specific tables
export_specific_tables() {
    echo "Available tables:"
    echo "1. customers"
    echo "2. repair_tickets"
    echo "3. appointments"
    echo "4. ticket_notes"
    echo "5. ticket_time_logs"
    echo "6. user_statistics"
    echo "7. user_activity_logs"
    echo "8. services"
    echo "9. devices"
    echo "10. users"
    echo ""
    read -p "Enter table numbers separated by spaces (e.g., 1 2 6): " table_selection
    
    TABLE_NAMES=(
        ""
        "customers"
        "repair_tickets"
        "appointments"
        "ticket_notes"
        "ticket_time_logs"
        "user_statistics"
        "user_activity_logs"
        "services"
        "devices"
        "users"
    )
    
    TABLE_LIST=""
    for num in $table_selection; do
        if [ $num -ge 1 ] && [ $num -le 10 ]; then
            TABLE_LIST="$TABLE_LIST -t public.${TABLE_NAMES[$num]}"
            echo "  Adding table: ${TABLE_NAMES[$num]}"
        fi
    done
    
    if [ -z "$TABLE_LIST" ]; then
        echo "No tables selected"
        return
    fi
    
    echo "Exporting selected tables..."
    
    pg_dump \
        --data-only \
        --no-owner \
        --no-privileges \
        $TABLE_LIST \
        -h $LOCAL_DB_HOST \
        -p $LOCAL_DB_PORT \
        -U $LOCAL_DB_USER \
        -d $LOCAL_DB_NAME \
        > selected_tables_dump.sql
    
    if [ $? -eq 0 ]; then
        echo "✓ Selected tables exported successfully to selected_tables_dump.sql"
        import_to_remote "selected_tables_dump.sql"
    else
        echo "✗ Export failed"
        exit 1
    fi
}

# Function to import data to remote
import_to_remote() {
    local dump_file=$1
    
    echo ""
    read -p "Do you want to import $dump_file to remote database? (y/n): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo "Importing data to remote database..."
        echo "NOTE: This may show some errors for duplicate keys which can be safely ignored"
        echo ""
        
        psql "$REMOTE_DB_URL" < $dump_file
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✓ Data imported successfully to remote database"
        else
            echo ""
            echo "⚠ Import completed with warnings (duplicate key errors are normal)"
        fi
    else
        echo "Import cancelled. You can manually import using:"
        echo "  psql \"$REMOTE_DB_URL\" < $dump_file"
    fi
}

# Function to run statistics population only
run_statistics_only() {
    echo "Running statistics population SQL on remote database..."
    
    MIGRATION_FILE="../supabase/migrations/20250906200000_populate_user_statistics_data.sql"
    
    if [ ! -f "$MIGRATION_FILE" ]; then
        echo "✗ Migration file not found: $MIGRATION_FILE"
        exit 1
    fi
    
    echo "This will:"
    echo "  - Populate created_by and assigned_to fields"
    echo "  - Generate user statistics for all users"
    echo "  - Create historical activity logs"
    echo "  - Calculate completion times and conversion rates"
    echo ""
    read -p "Continue? (y/n): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        psql "$REMOTE_DB_URL" < $MIGRATION_FILE
        
        if [ $? -eq 0 ]; then
            echo "✓ Statistics populated successfully"
        else
            echo "✗ Statistics population failed"
            exit 1
        fi
    else
        echo "Cancelled"
    fi
}

# Main script
while true; do
    show_menu
    
    case $choice in
        1)
            export_all_data
            ;;
        2)
            export_statistics_data
            ;;
        3)
            export_specific_tables
            ;;
        4)
            run_statistics_only
            ;;
        5)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option. Please try again."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done