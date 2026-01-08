# Survey CSV Import Guide

## Overview

You can now import surveys via CSV files in the admin panel. This allows you to quickly create surveys with all questions and options in one go.

## CSV Template Format

### Required Columns

- `title` - Survey title (string)
- `type` - Survey type: `GUEST` or `DAILY`
- `questionText` - Question text (string)

### Optional Survey Columns

- `description` - Survey description (string)
- `coinsReward` - Total coins for completing survey (number, default: 10)
- `publishAt` - Scheduled publish date/time (ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`)
- `expiryType` - Expiry calculation method: `SPECIFIC_DATE` or `RELATIVE_DAYS` (or empty for no expiry)
- `expiresAt` - Specific expiry date/time (ISO 8601 format, only if `expiryType=SPECIFIC_DATE`)
- `expiryDays` - Number of days until expiry (number, only if `expiryType=RELATIVE_DAYS`)

### Optional Question Columns

- `questionType` - Question type: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, or `RATING` (default: `SINGLE_CHOICE`)
- `questionCoinsReward` - Coins awarded per answer (number, default: 0)
- `questionExplanation` - Explanation shown after answering (string)

### Optional Option Columns

- `optionText` - Option text (string)
- `optionEmoji` - Option emoji (string, single emoji character)
- `optionIsCorrect` - Whether option is correct: `true` or `false` (for analytics, not used for scoring)

## Important Notes

1. **Survey data is on the first row only** - The first row defines the survey. Subsequent rows should repeat the survey info if needed.

2. **Each row represents one option** - For a question with 4 options, you need 4 rows with the same question text.

3. **Questions are grouped by `questionText`** - All rows with the same `questionText` are grouped as one question.

4. **Date Format** - Use ISO 8601 format: `2026-01-10T10:00:00Z` or `2026-01-10T10:00:00.000Z`

5. **Expiry Types**:
   - `SPECIFIC_DATE` - Survey expires at a specific date/time (use `expiresAt` column)
   - `RELATIVE_DAYS` - Survey expires X days after publish (use `expiryDays` column)
   - Empty - Survey never expires

## Example CSV Template

```csv
title,description,type,coinsReward,publishAt,expiryType,expiresAt,expiryDays,questionText,questionType,questionCoinsReward,questionExplanation,optionText,optionEmoji,optionIsCorrect
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,What is the capital of France?,SINGLE_CHOICE,5,Paris is the capital and largest city of France,Paris,🇫🇷,true
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,What is the capital of France?,SINGLE_CHOICE,5,Paris is the capital and largest city of France,London,🇬🇧,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,What is the capital of France?,SINGLE_CHOICE,5,Paris is the capital and largest city of France,Berlin,🇩🇪,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,What is the capital of France?,SINGLE_CHOICE,5,Paris is the capital and largest city of France,Madrid,🇪🇸,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,The Earth is round,TRUE_FALSE,3,The Earth is approximately spherical,True,✅,true
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,The Earth is round,TRUE_FALSE,3,The Earth is approximately spherical,False,❌,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,Rate your experience,RATING,2,How satisfied are you?,1,😞,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,Rate your experience,RATING,2,How satisfied are you?,2,😐,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,Rate your experience,RATING,2,How satisfied are you?,3,🙂,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,Rate your experience,RATING,2,How satisfied are you?,4,😊,false
Daily Quiz 1,A fun daily quiz,DAILY,20,2026-01-10T10:00:00Z,RELATIVE_DAYS,,7,Rate your experience,RATING,2,How satisfied are you?,5,😍,false
```

## Breakdown of the Example

This CSV creates:

**Survey:**
- Title: "Daily Quiz 1"
- Description: "A fun daily quiz"
- Type: DAILY
- Coins Reward: 20 coins
- Scheduled to publish: Jan 10, 2026 at 10:00 AM UTC
- Expires: 7 days after publish date

**Questions:**

1. **Single Choice Question**: "What is the capital of France?"
   - Type: SINGLE_CHOICE
   - Reward: 5 coins per answer
   - Explanation: "Paris is the capital and largest city of France"
   - Options: Paris (🇫🇷), London (🇬🇧), Berlin (🇩🇪), Madrid (🇪🇸)

2. **True/False Question**: "The Earth is round"
   - Type: TRUE_FALSE
   - Reward: 3 coins per answer
   - Explanation: "The Earth is approximately spherical"
   - Options: True (✅), False (❌)

3. **Rating Question**: "Rate your experience"
   - Type: RATING
   - Reward: 2 coins per answer
   - Explanation: "How satisfied are you?"
   - Options: 1-5 with emoji labels (😞, 😐, 🙂, 😊, 😍)

## How to Use

1. Go to **Admin Panel** → **Surveys**
2. Click **"Import CSV"** button
3. Upload your CSV file or paste CSV content
4. Review the template guide if needed
5. Click **"Import Survey"**
6. The survey will be created with all questions and options
7. Edit the survey if needed and publish when ready

## Tips

- Start with the provided template and modify it for your needs
- Use Excel, Google Sheets, or any CSV editor to create your file
- Keep question text exactly the same for all options of that question
- Test with a small CSV first before creating large surveys
- Leave optional fields empty if not needed (except dates which should be omitted entirely)
- After import, the survey will be in DRAFT mode - review and publish manually

## Common Errors

- **"CSV must include title and type columns"** - Make sure your CSV has the required columns
- **"Survey type must be GUEST or DAILY"** - Check the `type` column value
- **"Invalid question type"** - Question type must be one of the four allowed types
- **"expiryType must be SPECIFIC_DATE or RELATIVE_DAYS"** - Check the `expiryType` column value
- **Date format errors** - Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)

