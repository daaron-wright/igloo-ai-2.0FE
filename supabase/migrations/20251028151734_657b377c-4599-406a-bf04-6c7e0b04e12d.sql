-- Create agents table to store ElevenLabs agent configurations
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  bio TEXT,
  llm TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read agents
CREATE POLICY "Anyone can view agents"
ON public.agents
FOR SELECT
USING (true);

-- Create policy to allow anyone to insert agents
CREATE POLICY "Anyone can insert agents"
ON public.agents
FOR INSERT
WITH CHECK (true);

-- Create policy to allow anyone to update agents
CREATE POLICY "Anyone can update agents"
ON public.agents
FOR UPDATE
USING (true);

-- Create policy to allow anyone to delete agents
CREATE POLICY "Anyone can delete agents"
ON public.agents
FOR DELETE
USING (true);