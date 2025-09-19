# Audio Transcription & Summarization Feature

## Overview

The app now includes automatic transcription and summarization of audio uploads using OpenAI's Whisper and GPT-4 APIs. When you upload an audio file, the system will:

1. **Transcribe** the audio using Whisper AI
2. **Save transcript** to "Transcribed Meetings" folder
3. **Generate SAFe Agile summary** using GPT-4
4. **Save summary** to "Meeting Summaries" folder

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-...`)

### 2. Configure Environment Variable

1. Open `.env.local` file in the project root
2. Replace the placeholder with your actual OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Save the file
4. Restart the development server

### 3. Test the Feature

1. Go to the Audio page in your app
2. Upload an audio file (supports MP3, WAV, M4A, OGG)
3. Fill in the title and other details
4. Click "Upload Audio"
5. You'll see a message confirming transcription is in progress

## How It Works

### Automatic Workflow

```
Audio Upload → Whisper Transcription → Document Creation → GPT-4 Summarization → Summary Document
```

### Created Folders

The system automatically creates these folders if they don't exist:

- **"Transcribed Meetings"** - Contains full transcripts
- **"Meeting Summaries"** - Contains AI-generated summaries

### Document Naming

- Transcript: `[Audio Title] - Transcript`
- Summary: `[Audio Title] - Meeting Summary`

### Summary Format

The AI generates summaries with:

- **Key Decisions Made**
- **Action Items** (with owners and deadlines)
- **Discussion Points**
- **Next Steps**
- **Participants & Contributions**
- **SAFe Agile Context** (Epics, Features, User Stories, etc.)

## API Endpoints

The feature uses these new API endpoints:

- `POST /api/transcribe` - Transcribes audio using Whisper
- `POST /api/create-transcript` - Creates transcript document
- `POST /api/create-summary` - Generates and saves AI summary

## File Support

Supported audio formats:
- MP3
- WAV
- M4A
- OGG
- AAC

## Error Handling

If transcription fails:
- Check your OpenAI API key is valid
- Ensure you have API credits
- Check audio file format is supported
- View browser console for detailed error messages

## Cost Considerations

- **Whisper API**: ~$0.006 per minute of audio
- **GPT-4 API**: ~$0.03 per 1K tokens (varies by summary length)

For a 30-minute meeting:
- Transcription: ~$0.18
- Summary: ~$0.30-0.90
- **Total: ~$0.50-1.00 per meeting**

## Manual Override

If you provide a manual transcript when uploading, the system will:
- Skip automatic transcription
- Still generate an AI summary from your transcript
- Save both transcript and summary to respective folders

This saves API costs when you already have transcripts available.