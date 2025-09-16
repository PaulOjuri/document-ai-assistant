-- Add folder_id and custom_date fields to audios table
ALTER TABLE public.audios
ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
ADD COLUMN custom_date DATE;

-- Create index for the new folder_id column
CREATE INDEX idx_audios_folder_id ON public.audios(folder_id);

-- Create index for the custom_date column
CREATE INDEX idx_audios_custom_date ON public.audios(custom_date);