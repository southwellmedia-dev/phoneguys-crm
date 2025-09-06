@echo off
setlocal enabledelayedexpansion

echo ================================================
echo Local to Remote Supabase Data Transfer Script
echo ================================================

:: Configuration
set LOCAL_DB_HOST=127.0.0.1
set LOCAL_DB_PORT=54322
set LOCAL_DB_USER=postgres
set LOCAL_DB_PASSWORD=postgres
set LOCAL_DB_NAME=postgres

:: Remote configuration
set REMOTE_DB_URL=postgresql://postgres.egotypldqzdzjclikmeg:iZPi-8JYjn?0KtvY@aws-0-us-east-1.pooler.supabase.com:6543/postgres

:menu
echo.
echo Select transfer option:
echo 1. Export ALL data (excluding auth and storage schemas)
echo 2. Export only user statistics and tracking data  
echo 3. Run statistics population SQL only (no data transfer)
echo 4. Quick populate statistics for all users
echo 5. Exit
echo.
set /p choice="Enter your choice [1-5]: "

if "%choice%"=="1" goto export_all
if "%choice%"=="2" goto export_statistics
if "%choice%"=="3" goto run_statistics
if "%choice%"=="4" goto quick_populate
if "%choice%"=="5" goto end
echo Invalid option. Please try again.
goto menu

:export_all
echo Exporting all data from local database...

pg_dump --data-only --no-owner --no-privileges --exclude-schema=auth --exclude-schema=storage --exclude-schema=extensions --exclude-schema=pgbouncer --exclude-schema=realtime --exclude-schema=supabase_functions --exclude-schema=supabase_migrations -h %LOCAL_DB_HOST% -p %LOCAL_DB_PORT% -U %LOCAL_DB_USER% -d %LOCAL_DB_NAME% > local_data_dump.sql

if %errorlevel% equ 0 (
    echo Data exported successfully to local_data_dump.sql
    goto import_prompt_all
) else (
    echo Export failed
    pause
    goto menu
)

:import_prompt_all
set /p confirm="Do you want to import local_data_dump.sql to remote database? (y/n): "
if /i "%confirm%"=="y" (
    echo Importing data to remote database...
    echo NOTE: This may show some errors for duplicate keys which can be safely ignored
    echo.
    psql "%REMOTE_DB_URL%" < local_data_dump.sql
    echo.
    echo Import completed. Check for any errors above.
) else (
    echo Import cancelled. You can manually import using:
    echo   psql "%REMOTE_DB_URL%" ^< local_data_dump.sql
)
pause
goto menu

:export_statistics
echo Exporting user statistics and tracking data...

pg_dump --data-only --no-owner --no-privileges -t public.user_statistics -t public.user_activity_logs -t public.repair_tickets -t public.appointments -t public.ticket_notes -t public.ticket_time_logs -h %LOCAL_DB_HOST% -p %LOCAL_DB_PORT% -U %LOCAL_DB_USER% -d %LOCAL_DB_NAME% > statistics_data_dump.sql

if %errorlevel% equ 0 (
    echo Statistics data exported successfully to statistics_data_dump.sql
    goto import_prompt_stats
) else (
    echo Export failed
    pause
    goto menu
)

:import_prompt_stats
set /p confirm="Do you want to import statistics_data_dump.sql to remote database? (y/n): "
if /i "%confirm%"=="y" (
    echo Importing data to remote database...
    echo NOTE: This may show some errors for duplicate keys which can be safely ignored
    echo.
    psql "%REMOTE_DB_URL%" < statistics_data_dump.sql
    echo.
    echo Import completed. Check for any errors above.
) else (
    echo Import cancelled. You can manually import using:
    echo   psql "%REMOTE_DB_URL%" ^< statistics_data_dump.sql
)
pause
goto menu

:run_statistics
echo Running statistics population SQL on remote database...
echo.
echo This will:
echo   - Populate created_by and assigned_to fields
echo   - Generate user statistics for all users
echo   - Create historical activity logs
echo   - Calculate completion times and conversion rates
echo.
set /p confirm="Continue? (y/n): "

if /i "%confirm%"=="y" (
    if exist ..\supabase\migrations\20250906200000_populate_user_statistics_data.sql (
        psql "%REMOTE_DB_URL%" < ..\supabase\migrations\20250906200000_populate_user_statistics_data.sql
        if %errorlevel% equ 0 (
            echo Statistics populated successfully
        ) else (
            echo Statistics population completed with warnings
        )
    ) else (
        echo Migration file not found: ..\supabase\migrations\20250906200000_populate_user_statistics_data.sql
    )
) else (
    echo Cancelled
)
pause
goto menu

:quick_populate
echo Quick populating statistics for all users...
echo.

:: Create a temporary SQL file with just the statistics update
echo -- Quick populate user statistics > temp_populate_stats.sql
echo DO $$ >> temp_populate_stats.sql
echo DECLARE >> temp_populate_stats.sql
echo     user_record RECORD; >> temp_populate_stats.sql
echo BEGIN >> temp_populate_stats.sql
echo     FOR user_record IN SELECT id FROM public.users >> temp_populate_stats.sql
echo     LOOP >> temp_populate_stats.sql
echo         PERFORM public.update_user_statistics(user_record.id); >> temp_populate_stats.sql
echo     END LOOP; >> temp_populate_stats.sql
echo     RAISE NOTICE 'User statistics populated for all users'; >> temp_populate_stats.sql
echo END $$; >> temp_populate_stats.sql

psql "%REMOTE_DB_URL%" < temp_populate_stats.sql

if %errorlevel% equ 0 (
    echo Statistics populated successfully for all users
    del temp_populate_stats.sql
) else (
    echo Statistics population failed
)
pause
goto menu

:end
echo Exiting...
exit /b 0