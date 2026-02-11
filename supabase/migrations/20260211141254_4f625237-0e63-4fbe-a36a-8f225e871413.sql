
-- P1.2-4: Fix FK constraints blocking admin_delete_user
-- Evidence: admin_reads (migration 20260208061905), faq_requests (20260119123047), admin_settings (20260205133257)
-- Strategy: SET NULL on delete to preserve audit history

-- 1) admin_reads.admin_id
ALTER TABLE public.admin_reads DROP CONSTRAINT IF EXISTS admin_reads_admin_id_fkey;
ALTER TABLE public.admin_reads ALTER COLUMN admin_id DROP NOT NULL;
ALTER TABLE public.admin_reads ADD CONSTRAINT admin_reads_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2) admin_reads.target_user_id
ALTER TABLE public.admin_reads DROP CONSTRAINT IF EXISTS admin_reads_target_user_id_fkey;
ALTER TABLE public.admin_reads ALTER COLUMN target_user_id DROP NOT NULL;
ALTER TABLE public.admin_reads ADD CONSTRAINT admin_reads_target_user_id_fkey
  FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3) faq_requests.user_id
ALTER TABLE public.faq_requests DROP CONSTRAINT IF EXISTS faq_requests_user_id_fkey;
ALTER TABLE public.faq_requests ADD CONSTRAINT faq_requests_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4) faq_requests.answered_by
ALTER TABLE public.faq_requests DROP CONSTRAINT IF EXISTS faq_requests_answered_by_fkey;
ALTER TABLE public.faq_requests ADD CONSTRAINT faq_requests_answered_by_fkey
  FOREIGN KEY (answered_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5) admin_settings.updated_by
ALTER TABLE public.admin_settings DROP CONSTRAINT IF EXISTS admin_settings_updated_by_fkey;
ALTER TABLE public.admin_settings ADD CONSTRAINT admin_settings_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Rollback notes:
-- To revert, re-add NOT NULL on admin_reads columns and recreate FKs without ON DELETE SET NULL:
-- ALTER TABLE public.admin_reads ALTER COLUMN admin_id SET NOT NULL;
-- ALTER TABLE public.admin_reads ALTER COLUMN target_user_id SET NOT NULL;
-- Then DROP and recreate each FK without ON DELETE SET NULL.
