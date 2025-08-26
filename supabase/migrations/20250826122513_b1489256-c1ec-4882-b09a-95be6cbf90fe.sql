-- Create table for custom GPTs
CREATE TABLE public.custom_gpts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  icon TEXT DEFAULT '🤖',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_gpts ENABLE ROW LEVEL SECURITY;

-- Create policies for custom GPTs
CREATE POLICY "Users can view their own GPTs" 
ON public.custom_gpts 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own GPTs" 
ON public.custom_gpts 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own GPTs" 
ON public.custom_gpts 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own GPTs" 
ON public.custom_gpts 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create table for training files
CREATE TABLE public.gpt_training_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gpt_id UUID NOT NULL REFERENCES public.custom_gpts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  original_url TEXT,
  processed_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gpt_training_files ENABLE ROW LEVEL SECURITY;

-- Create policies for training files
CREATE POLICY "Users can view files for their own GPTs" 
ON public.gpt_training_files 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can upload files for their own GPTs" 
ON public.gpt_training_files 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete files for their own GPTs" 
ON public.gpt_training_files 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create storage bucket for training files
INSERT INTO storage.buckets (id, name, public) VALUES ('gpt-training-files', 'gpt-training-files', false);

-- Create storage policies
CREATE POLICY "Users can upload their own training files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'gpt-training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own training files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gpt-training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own training files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'gpt-training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_gpts_updated_at
BEFORE UPDATE ON public.custom_gpts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();