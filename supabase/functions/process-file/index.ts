import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const gptId = formData.get('gptId') as string;

    if (!file || !gptId) {
      return new Response(JSON.stringify({ error: 'Missing file or GPT ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Process the file content based on type
    let processedContent = '';
    
    if (file.type === 'text/plain') {
      processedContent = await file.text();
    } else if (file.type === 'application/pdf') {
      // For PDF processing, we'll extract text using a simple approach
      // Note: This is a basic implementation. For production, consider using pdf-parse
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Simple text extraction from PDF (basic approach)
      const text = new TextDecoder().decode(bytes);
      const textMatch = text.match(/BT\s*(.*?)\s*ET/gs);
      if (textMatch) {
        processedContent = textMatch.map(match => 
          match.replace(/BT\s*|\s*ET/g, '')
               .replace(/\/\w+\s+\d+\s+Tf/g, '')
               .replace(/\d+\s+\d+\s+Td/g, ' ')
               .replace(/Tj/g, '')
               .replace(/[()]/g, '')
        ).join(' ').trim();
      } else {
        processedContent = 'PDF content could not be extracted automatically. Please try with a text file.';
      }
    } else if (file.type.includes('image/')) {
      // For images, we'll store the description
      processedContent = `Image file: ${file.name} (${file.type}). Content analysis would require vision AI processing.`;
    } else if (file.type.includes('application/vnd.openxmlformats') || file.type.includes('application/msword')) {
      // For Word documents
      processedContent = `Word document: ${file.name}. Content extraction requires specialized processing.`;
    } else {
      try {
        processedContent = await file.text();
      } catch {
        processedContent = `File: ${file.name} (${file.type}). Content type not directly readable as text.`;
      }
    }

    // Upload file to storage
    const fileName = `${user.id}/${gptId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('gpt-training-files')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('gpt-training-files')
      .getPublicUrl(fileName);

    // Save file metadata and processed content to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('gpt_training_files')
      .insert({
        gpt_id: gptId,
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        original_url: publicUrl,
        processed_content: processedContent
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to save file record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('File processed successfully:', fileRecord);

    return new Response(JSON.stringify({ 
      success: true, 
      file: fileRecord,
      contentLength: processedContent.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-file function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});