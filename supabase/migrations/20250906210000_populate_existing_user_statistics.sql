-- Populate statistics for existing users
-- This migration should be run after users and data exist in the database

-- Step 1: Populate statistics for all existing users
DO $$
DECLARE
    user_record RECORD;
    user_count INTEGER := 0;
BEGIN
    -- Loop through all users and calculate their statistics
    FOR user_record IN SELECT id, email FROM public.users
    LOOP
        -- Call the update_user_statistics function for each user
        PERFORM public.update_user_statistics(user_record.id);
        user_count := user_count + 1;
        RAISE NOTICE 'Updated statistics for user: %', user_record.email;
    END LOOP;
    
    RAISE NOTICE 'Statistics populated for % users', user_count;
END $$;

-- Step 2: Ensure all tickets have created_by populated
DO $$
DECLARE
    admin_user_id UUID;
    updated_count INTEGER;
BEGIN
    -- Get the first admin user
    SELECT id INTO admin_user_id 
    FROM public.users 
    WHERE role = 'admin' 
    ORDER BY created_at 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Update repair_tickets that don't have created_by
        UPDATE public.repair_tickets 
        SET created_by = admin_user_id
        WHERE created_by IS NULL;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        IF updated_count > 0 THEN
            RAISE NOTICE 'Updated created_by for % tickets', updated_count;
        END IF;
        
        -- Update appointments that don't have created_by
        UPDATE public.appointments 
        SET created_by = admin_user_id
        WHERE created_by IS NULL;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        IF updated_count > 0 THEN
            RAISE NOTICE 'Updated created_by for % appointments', updated_count;
        END IF;
    END IF;
END $$;

-- Step 3: Recalculate statistics after updating tracking fields
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Recalculate for all users to ensure accuracy
    FOR user_record IN SELECT id FROM public.users
    LOOP
        PERFORM public.update_user_statistics(user_record.id);
    END LOOP;
    
    RAISE NOTICE 'Final statistics calculation completed';
END $$;

-- Step 4: Verify statistics were created
DO $$
DECLARE
    stats_count INTEGER;
    users_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO stats_count FROM public.user_statistics;
    SELECT COUNT(*) INTO users_count FROM public.users;
    
    RAISE NOTICE 'Statistics summary: % statistics records for % users', stats_count, users_count;
    
    -- Show sample statistics for verification
    IF stats_count > 0 THEN
        RAISE NOTICE 'Sample statistics created successfully';
    ELSE
        RAISE WARNING 'No statistics were created - please check user data';
    END IF;
END $$;