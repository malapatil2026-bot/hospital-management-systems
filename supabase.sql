-- ============================================================
-- HOSPITAL MANAGEMENT SYSTEM
-- Doctors table + Patient-Doctor relationship
-- Existing patients table: idno, name, age, disease
-- New doctors table: idno, name, specialisation
-- ============================================================

-- 1. Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
    idno BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    specialisation TEXT NOT NULL
);

-- 2. Add doctor_id to existing patients table
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS doctor_id BIGINT;

-- 3. Create the relationship:
--    patients.doctor_id -> doctors.idno
ALTER TABLE public.patients
DROP CONSTRAINT IF EXISTS patients_doctor_id_fkey;

ALTER TABLE public.patients
ADD CONSTRAINT patients_doctor_id_fkey
FOREIGN KEY (doctor_id)
REFERENCES public.doctors(idno)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- 4. Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- 5. Remove existing policies
DROP POLICY IF EXISTS "Allow public read doctors" ON public.doctors;
DROP POLICY IF EXISTS "Allow public insert doctors" ON public.doctors;
DROP POLICY IF EXISTS "Allow public update doctors" ON public.doctors;
DROP POLICY IF EXISTS "Allow public delete doctors" ON public.doctors;

DROP POLICY IF EXISTS "Allow public read patients" ON public.patients;
DROP POLICY IF EXISTS "Allow public insert patients" ON public.patients;
DROP POLICY IF EXISTS "Allow public update patients" ON public.patients;
DROP POLICY IF EXISTS "Allow public delete patients" ON public.patients;

-- 6. Doctor CRUD policies
CREATE POLICY "Allow public read doctors"
ON public.doctors FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert doctors"
ON public.doctors FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public update doctors"
ON public.doctors FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete doctors"
ON public.doctors FOR DELETE TO anon USING (true);

-- 7. Patient CRUD policies
CREATE POLICY "Allow public read patients"
ON public.patients FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public insert patients"
ON public.patients FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public update patients"
ON public.patients FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete patients"
ON public.patients FOR DELETE TO anon USING (true);

-- 8. Check relationship
SELECT
    p.idno AS patient_id,
    p.name AS patient_name,
    p.age,
    p.disease,
    d.idno AS doctor_id,
    d.name AS doctor_name,
    d.specialisation
FROM public.patients p
LEFT JOIN public.doctors d
ON p.doctor_id = d.idno
ORDER BY p.idno;

-- IMPORTANT:
-- Existing patients may have NULL doctor_id.
-- New patients in the application must select a doctor.
-- To make doctor assignment mandatory after existing records
-- are assigned, run:
--
-- ALTER TABLE public.patients
-- ALTER COLUMN doctor_id SET NOT NULL;
