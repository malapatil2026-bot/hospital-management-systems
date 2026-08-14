# Hospital Management System — Patients + Doctors

## Technology
HTML, CSS, JavaScript, Supabase, GitHub, VS Code and Vercel.

## Tables

### patients
- idno — BIGINT PRIMARY KEY
- name — TEXT
- age — INTEGER
- disease — TEXT
- doctor_id — BIGINT FOREIGN KEY

### doctors
- idno — BIGINT PRIMARY KEY
- name — TEXT
- specialisation — TEXT

## Relationship

`patients.doctor_id` references `doctors.idno`.

This is a many-to-one relationship:
- One doctor can be assigned to many patients.
- Each patient can be assigned to one doctor.

The database uses `ON DELETE RESTRICT`, so a doctor cannot be deleted while patients are still linked to that doctor.

## CRUD

Patients:
- Create
- Read
- Update
- Delete
- Search

Doctors:
- Create
- Read
- Update
- Delete
- Search

## Supabase setup

1. Open Supabase SQL Editor.
2. Run the complete `supabase.sql`.
3. Open the project in VS Code.
4. Run `index.html` with Live Server.
5. Add doctors first.
6. Add patients and select a doctor.

The supplied Supabase anon/public key is configured in `config.js`.

Never put a Supabase service_role/secret key in frontend code.

For actual hospital patient data, use Supabase Authentication and restrict RLS policies to authorized hospital staff.
