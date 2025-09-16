-- Add folder_id and custom_date fields to notes table
ALTER TABLE public.notes
ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
ADD COLUMN custom_date DATE;

-- Create index for the new folder_id column
CREATE INDEX idx_notes_folder_id ON public.notes(folder_id);

-- Create index for the custom_date column
CREATE INDEX idx_notes_custom_date ON public.notes(custom_date);