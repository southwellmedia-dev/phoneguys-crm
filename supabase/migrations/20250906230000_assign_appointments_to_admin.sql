-- Assign appointments to admin user for proper conversion statistics
-- This migration assigns existing appointments to users to show conversion metrics

DO $$
DECLARE
    admin_user_id UUID;
    tech1_user_id UUID;
    tech2_user_id UUID;
    appointment_count INTEGER;
    converted_count INTEGER;
BEGIN
    -- Get user IDs
    SELECT id INTO admin_user_id FROM public.users WHERE email = 'admin@phoneguys.com' LIMIT 1;
    SELECT id INTO tech1_user_id FROM public.users WHERE email = 'tech1@phoneguys.com' LIMIT 1;
    SELECT id INTO tech2_user_id FROM public.users WHERE email = 'tech2@phoneguys.com' LIMIT 1;
    
    -- If specific users don't exist, use role-based selection
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM public.users WHERE role = 'admin' ORDER BY created_at LIMIT 1;
    END IF;
    
    -- Count existing appointments
    SELECT COUNT(*) INTO appointment_count FROM public.appointments;
    RAISE NOTICE 'Found % total appointments', appointment_count;
    
    -- Assign appointments to users in a balanced way
    -- Assign first 2 converted appointments to admin
    WITH numbered_appointments AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
        FROM public.appointments
        WHERE status = 'converted' AND assigned_to IS NULL
    )
    UPDATE public.appointments a
    SET 
        assigned_to = admin_user_id,
        created_by = admin_user_id,
        converted_by = admin_user_id
    FROM numbered_appointments na
    WHERE a.id = na.id AND na.rn <= 2 AND admin_user_id IS NOT NULL;
    
    GET DIAGNOSTICS converted_count = ROW_COUNT;
    IF converted_count > 0 THEN
        RAISE NOTICE 'Assigned % converted appointments to admin user', converted_count;
    END IF;
    
    -- Assign one converted appointment to tech1 if exists
    IF tech1_user_id IS NOT NULL THEN
        UPDATE public.appointments
        SET 
            assigned_to = tech1_user_id,
            created_by = tech1_user_id,
            converted_by = tech1_user_id
        WHERE status = 'converted' 
            AND assigned_to IS NULL
            AND id = (
                SELECT id FROM public.appointments 
                WHERE status = 'converted' AND assigned_to IS NULL 
                ORDER BY created_at 
                LIMIT 1
            );
        
        GET DIAGNOSTICS converted_count = ROW_COUNT;
        IF converted_count > 0 THEN
            RAISE NOTICE 'Assigned % converted appointment to tech1', converted_count;
        END IF;
    END IF;
    
    -- Assign remaining converted appointments to tech2 if exists
    IF tech2_user_id IS NOT NULL THEN
        UPDATE public.appointments
        SET 
            assigned_to = tech2_user_id,
            created_by = tech2_user_id,
            converted_by = tech2_user_id
        WHERE status = 'converted' AND assigned_to IS NULL;
        
        GET DIAGNOSTICS converted_count = ROW_COUNT;
        IF converted_count > 0 THEN
            RAISE NOTICE 'Assigned % converted appointments to tech2', converted_count;
        END IF;
    END IF;
    
    -- For any scheduled appointments, assign to admin
    UPDATE public.appointments
    SET 
        assigned_to = admin_user_id,
        created_by = admin_user_id
    WHERE status = 'scheduled' 
        AND assigned_to IS NULL 
        AND admin_user_id IS NOT NULL;
    
    GET DIAGNOSTICS appointment_count = ROW_COUNT;
    IF appointment_count > 0 THEN
        RAISE NOTICE 'Assigned % scheduled appointments to admin', appointment_count;
    END IF;
    
    -- Create some non-converted appointments for admin to show conversion rate
    -- Update one scheduled appointment if it exists
    UPDATE public.appointments
    SET 
        status = 'scheduled',
        converted_to_ticket_id = NULL,
        converted_by = NULL,
        assigned_to = admin_user_id,
        created_by = admin_user_id
    WHERE id = (
        SELECT id FROM public.appointments 
        WHERE assigned_to = admin_user_id 
        ORDER BY created_at DESC 
        LIMIT 1
    ) AND admin_user_id IS NOT NULL;
    
    -- Recalculate user statistics after assignment changes
    PERFORM public.update_user_statistics(admin_user_id) WHERE admin_user_id IS NOT NULL;
    PERFORM public.update_user_statistics(tech1_user_id) WHERE tech1_user_id IS NOT NULL;
    PERFORM public.update_user_statistics(tech2_user_id) WHERE tech2_user_id IS NOT NULL;
    
    -- Report final statistics
    IF admin_user_id IS NOT NULL THEN
        SELECT 
            appointments_assigned,
            appointments_converted,
            conversion_rate
        INTO appointment_count, converted_count
        FROM public.user_statistics
        WHERE user_id = admin_user_id;
        
        RAISE NOTICE '====================================';
        RAISE NOTICE 'Admin appointment statistics:';
        RAISE NOTICE 'Appointments assigned: %', COALESCE(appointment_count, 0);
        RAISE NOTICE 'Appointments converted: %', COALESCE(converted_count, 0);
        RAISE NOTICE '====================================';
    END IF;
END $$;

-- Final recalculation of all user statistics
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM public.users
    LOOP
        PERFORM public.update_user_statistics(user_record.id);
    END LOOP;
    
    RAISE NOTICE 'All user statistics recalculated successfully';
END $$;