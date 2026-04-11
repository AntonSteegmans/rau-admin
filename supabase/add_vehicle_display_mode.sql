-- Migration: add display_mode and image_path to vehicles table
-- Run this in the Supabase SQL editor

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS display_mode text NOT NULL DEFAULT '3d'
    CHECK (display_mode IN ('3d', 'image')),
  ADD COLUMN IF NOT EXISTS image_path text;
