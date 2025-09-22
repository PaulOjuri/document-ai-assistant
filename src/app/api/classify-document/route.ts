import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { documentId, content, title, fileType } = await request.json();

    if (!content || !title) {
      return NextResponse.json({ error: 'Content and title are required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing folders for context
    const { data: folders } = await supabase
      .from('folders')
      .select('id, name, parent_id')
      .eq('user_id', user.id)
      .order('name');

    // Get sample documents from each folder to understand folder patterns
    const { data: sampleDocs } = await supabase
      .from('documents')
      .select('title, content, folder_id, artifact_type, file_type')
      .eq('user_id', user.id)
      .limit(50);

    // Build folder structure and patterns
    const folderPatterns = folders?.map(folder => {
      const docsInFolder = sampleDocs?.filter(doc => doc.folder_id === folder.id) || [];
      return {
        name: folder.name,
        id: folder.id,
        documentCount: docsInFolder.length,
        commonFileTypes: [...new Set(docsInFolder.map(d => d.file_type))],
        commonArtifactTypes: [...new Set(docsInFolder.map(d => d.artifact_type))],
        sampleTitles: docsInFolder.slice(0, 3).map(d => d.title),
      };
    }) || [];

    const classificationPrompt = `You are an expert document classifier specializing in SAFe/Agile organizational structures. Analyze this document and provide intelligent classification and folder placement suggestions.

**DOCUMENT TO CLASSIFY:**
Title: ${title}
File Type: ${fileType}
Content Preview: ${content.substring(0, 3000)}...

**EXISTING FOLDER STRUCTURE:**
${JSON.stringify(folderPatterns, null, 2)}

**ANALYSIS REQUIRED:**
1. **Document Type Classification**: Identify what type of SAFe/Agile artifact this is
2. **Business Purpose**: Understand the document's role in the development process
3. **Content Analysis**: Analyze themes, stakeholders, and business context
4. **Folder Recommendation**: Suggest the most appropriate existing folder OR recommend creating a new folder
5. **Organization Insights**: Identify if existing organization could be improved

**RETURN FORMAT (JSON):**
{
  "classification": {
    "documentType": "user_story|epic|feature|requirement|meeting_notes|technical_doc|process_doc|presentation|data_config|other",
    "confidence": 0.95,
    "businessPurpose": "Brief description of document's role",
    "keyThemes": ["theme1", "theme2", "theme3"],
    "stakeholders": ["role1", "role2"],
    "maturityLevel": "basic|intermediate|advanced"
  },
  "folderRecommendation": {
    "suggestedFolderId": "existing_folder_id_or_null",
    "suggestedFolderName": "folder_name",
    "confidence": 0.90,
    "reasoning": "Why this folder is appropriate",
    "alternativeOptions": [
      {"folderId": "alt_id", "folderName": "alt_name", "reasoning": "alternative reason"}
    ]
  },
  "organizationInsights": {
    "isWellOrganized": true|false,
    "misplacedDocuments": ["doc_title1", "doc_title2"],
    "suggestedNewFolders": ["New Folder Name 1", "New Folder Name 2"],
    "improvementRecommendations": "How to better organize the workspace"
  },
  "contentInsights": {
    "completeness": "complete|incomplete|draft",
    "qualityScore": 0.85,
    "missingElements": ["acceptance_criteria", "business_value"],
    "recommendations": "Specific suggestions to improve this document"
  }
}

Analyze deeply and provide actionable insights based on SAFe best practices.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: classificationPrompt,
        },
      ],
    });

    let classificationResult;
    try {
      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      classificationResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing classification response:', parseError);
      return NextResponse.json({ error: 'Failed to parse classification results' }, { status: 500 });
    }

    // If we have a document ID, update it with the classification
    if (documentId && classificationResult.classification) {
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          artifact_type: classificationResult.classification.documentType,
          tags: classificationResult.classification.keyThemes || [],
          folder_id: classificationResult.folderRecommendation.suggestedFolderId,
        })
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating document classification:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      classification: classificationResult
    });

  } catch (error) {
    console.error('Document classification error:', error);
    return NextResponse.json(
      { error: 'Failed to classify document' },
      { status: 500 }
    );
  }
}