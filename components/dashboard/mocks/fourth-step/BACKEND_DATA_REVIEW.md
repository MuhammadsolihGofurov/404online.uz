# Backend Data Architecture Review & Critical Issues

## 🔴 **CRITICAL VULNERABILITIES IDENTIFIED**

### 1. **DATA REDUNDANCY CRISIS - Reading Passage Duplication**

#### Current Problem:
```javascript
// CURRENT STRUCTURE (PROBLEMATIC)
Question 1 (Q1-Q5): {
  prompt: "<p>Long IELTS Reading Passage (3000 words)...</p>",
  content: { statements: ["Statement 1", "Statement 2", ...] },
  correct_answer: { values: { "1": "A", "2": "B", ... } }
}
```

**Issue:** The reading passage is stored in `prompt`, which is **per-question record**. For IELTS Reading Q1-5, this means:
- ❌ 3000-word passage duplicated 5 times in DB
- ❌ If admin edits the passage, they must edit 5 separate records
- ❌ Inconsistency risk: Q1 might have v1 of passage, Q5 has v2
- ❌ Massive API payload (15KB+ per question × 5 = 75KB+ for one passage)

#### Real-World Impact:
```sql
-- Current inefficient storage
SELECT * FROM mock_questions WHERE question_number_start = 1;
-- Returns: 3KB passage + 500B metadata = 3.5KB

SELECT * FROM mock_questions WHERE question_number_start BETWEEN 1 AND 5;
-- Returns: 5 × 3.5KB = 17.5KB for ONE passage group
```

---

### 2. **ANSWER VARIANT SUPPORT - CRITICAL FOR IELTS**

#### Current Problem:
```javascript
// CURRENT (WRONG)
SHORT_ANSWER: {
  correct_answer: { value: "bus stop" }  // ❌ Only accepts exact match
}
```

**Real IELTS Requirement:**
- "bus stop" ✅
- "bus-stop" ✅
- "bus station" ✅ (synonym accepted)
- "Bus Stop" ✅ (case insensitive)
- "busstop" ❌ (not accepted)

#### Current Code Analysis:
```javascript
// questionConfig.js line 99-105
SHORT_ANSWER: () => ({
  instructions: "",
  answer_length_limit: 3,
  pre_text: "",
  post_text: "",
  variants: [],  // ⚠️ EXISTS but NOT USED in validation!
}),

// questionValidation.js - SHORT_ANSWER validation
if (!state.correct_answer?.value) {
  return "Provide model answer for short answer.";
}
// ❌ Only checks existence, not array of variants
```

**Risk:** Students get 0 points for valid alternative answers like "bus-stop" instead of "bus stop".

---

### 3. **WORD BANK ORPHANED ANSWERS**

#### Current Problem:
```javascript
// Admin workflow:
// 1. Create word bank: ["apple", "banana", "orange"]
// 2. Set correct_answer.values.1 = "apple"
// 3. Admin deletes "apple" from word bank
// 4. ❌ correct_answer still references "apple" (orphaned)

// Current validation (questionValidation.js line 252-265)
const unansweredBlanks = blanks.filter((id) => {
  const value = answers[id];
  if (isDragDropSummary) {
    return (
      !value ||
      !wordBankContainsValue(state.content?.word_bank || [], value)
    );
  }
  return !value || String(value).trim().length === 0;
});
```

**Partial Fix Exists:** `wordBankContainsValue` check DURING validation.

**Missing Protection:**
- ❌ No backend constraint preventing deletion of referenced words
- ❌ No cascade update when word is removed
- ❌ No visual warning in UI before deleting referenced word

---

### 4. **GROUP STATE COLLISION - STUDENT ANSWER OVERWRITES**

#### Current Problem:
```javascript
// Frontend state structure
const studentAnswer = {
  question_id: 123,  // Represents Q1-Q5
  answer: {
    values: {
      "1": "A",
      "2": "B",
      "3": "C",
      // Student submits Q1-Q3, then navigates away
    }
  }
}

// Student comes back, starts Q4
// ❌ RISK: If frontend doesn't merge properly, Q1-Q3 answers might be lost
```

**Current Backend Likely Structure:**
```python
# backend/apps/mocks/models.py (assumed)
class StudentAnswer(models.Model):
    question = models.ForeignKey(MockQuestion)  # Points to grouped Q1-Q5
    answer = models.JSONField()  # { "values": { "1": "A", "2": "B" } }
    
    # ❌ If student submits partial answers multiple times:
    # First submission: {"values": {"1": "A"}}
    # Second submission: {"values": {"4": "D"}}  
    # Does it MERGE or REPLACE?
```

---

### 5. **SCALABILITY ISSUES**

#### Payload Size Analysis:
```javascript
// SUMMARY_FILL_BLANKS with 20 blanks in "bullet" mode
{
  content: {
    rows: [
      { id: "1", pre_text: "Some text", blank_id: "1", post_text: "more text" },
      // × 20 rows = ~2KB
    ],
    word_bank: ["word1", "word2", ...], // If 50 words = ~1KB
    blanks: ["1", "2", ..., "20"]  // ~100B
  },
  correct_answer: {
    values: { "1": "ans1", "2": "ans2", ... }  // ~500B
  }
}
// Total: ~3.5KB for ONE question
// For 40-question mock: 140KB+ per API call
```

**Current API Endpoints (assumed):**
```python
# GET /api/mock-questions/?section_id=123
# Returns ALL questions in section (could be 40+)
# ❌ No pagination, no lazy loading
```

---

## 🔧 **PROPOSED SOLUTIONS**

### Solution 1: **Hierarchical Data Model**

```javascript
// NEW PROPOSED STRUCTURE

// === PASSAGE MODEL (Parent) ===
Passage: {
  id: "passage_uuid_123",
  section_id: "section_456",
  passage_type: "READING_TEXT",  // or "IMAGE", "AUDIO_URL"
  content: "<p>Long reading passage here...</p>",
  display_order: 1,
  metadata: {
    word_count: 850,
    difficulty: "MEDIUM"
  }
}

// === QUESTION MODEL (Child) ===
Question: {
  id: "question_uuid_789",
  passage_id: "passage_uuid_123",  // 🔗 Foreign key
  question_type: "MCQ_SINGLE",
  question_number_start: 1,
  question_number_end: 5,
  
  // ✅ NO MORE DUPLICATE PASSAGES
  prompt: "<p>Based on the passage, which statement is true?</p>",
  
  content: {
    // Question-specific data only
    statements: ["Statement for Q1", "Statement for Q2", ...],
    options: [{ value: "A", text: "Option A" }, ...]
  },
  
  correct_answer: {
    values: { "1": "A", "2": "B", ... }
  }
}

// === STUDENT ANSWER MODEL ===
StudentAnswer: {
  id: "answer_uuid_001",
  student_id: "student_789",
  question_id: "question_uuid_789",
  
  // ✅ Granular per sub-question
  answer_data: {
    "1": { value: "A", timestamp: "2025-01-01T10:00:00Z" },
    "2": { value: "B", timestamp: "2025-01-01T10:01:00Z" },
    // Merge strategy: last_timestamp wins
  },
  
  is_partial: true,  // ✅ Flag for incomplete submissions
  last_updated: "2025-01-01T10:01:00Z"
}
```

**Benefits:**
- ✅ Passage stored once, referenced by multiple questions
- ✅ Easy bulk update (edit passage once, affects all Q1-Q5)
- ✅ API can load passage separately: `GET /passages/123` (cached)
- ✅ Questions become lightweight: ~500B instead of 3.5KB

---

### Solution 2: **Enhanced Answer Schema with Variants**

```javascript
// CURRENT (WRONG)
SHORT_ANSWER: {
  correct_answer: { value: "bus stop" }
}

// PROPOSED (CORRECT)
SHORT_ANSWER: {
  correct_answer: {
    primary: "bus stop",  // Main answer
    accepted_variants: [
      { value: "bus-stop", score_percentage: 100 },
      { value: "bus station", score_percentage: 100 },
      { value: "busstop", score_percentage: 0 }  // Explicit rejection
    ],
    matching_rules: {
      case_sensitive: false,
      trim_whitespace: true,
      allow_punctuation_variance: true
    }
  }
}

// For grouped questions
SHORT_ANSWER (Q1-Q5): {
  correct_answer: {
    values: {
      "1": {
        primary: "bus stop",
        accepted_variants: ["bus-stop", "bus station"],
        matching_rules: { case_sensitive: false }
      },
      "2": {
        primary: "train",
        accepted_variants: ["locomotive", "railway train"]
      }
    }
  }
}
```

**Backend Validation Function:**
```python
def validate_short_answer(student_answer, correct_answer_obj):
    """IELTS-compliant answer validation"""
    primary = correct_answer_obj['primary']
    variants = correct_answer_obj.get('accepted_variants', [])
    rules = correct_answer_obj.get('matching_rules', {})
    
    # Normalize student answer
    normalized = student_answer.strip()
    if not rules.get('case_sensitive', False):
        normalized = normalized.lower()
        primary = primary.lower()
        variants = [v.lower() for v in variants]
    
    # Check primary
    if normalized == primary:
        return True, 100
    
    # Check variants
    for variant in variants:
        if isinstance(variant, dict):
            if normalized == variant['value']:
                return True, variant.get('score_percentage', 100)
        elif normalized == variant:
            return True, 100
    
    return False, 0
```

---

### Solution 3: **Word Bank Referential Integrity**

```javascript
// ENHANCED WORD BANK STRUCTURE
SUMMARY_DRAG_DROP: {
  content: {
    word_bank: [
      {
        id: "word_uuid_001",
        text: "apple",
        value: "apple",
        is_referenced: true,  // ✅ Computed flag
        reference_count: 2     // Used in blanks 1 and 3
      },
      {
        id: "word_uuid_002",
        text: "banana",
        value: "banana",
        is_referenced: false,  // ✅ Safe to delete
        reference_count: 0
      }
    ]
  },
  correct_answer: {
    values: {
      "1": { word_id: "word_uuid_001", word_value: "apple" },  // ✅ Store both
      "2": { word_id: "word_uuid_002", word_value: "banana" }
    }
  }
}
```

**Backend Validation Enhancement:**
```javascript
// questionValidation.js - ENHANCED VERSION

const validateSummaryDragDrop = (state) => {
  const wordBank = state.content?.word_bank || [];
  const answers = state.correct_answer?.values || {};
  
  // 1. Check all answers reference existing word bank items
  const orphanedAnswers = [];
  Object.entries(answers).forEach(([blankId, answerData]) => {
    const wordExists = wordBank.some(word => 
      word.id === answerData.word_id || word.value === answerData.word_value
    );
    
    if (!wordExists) {
      orphanedAnswers.push(blankId);
    }
  });
  
  if (orphanedAnswers.length > 0) {
    return `Blanks ${orphanedAnswers.join(', ')} reference deleted words. Please update answers.`;
  }
  
  // 2. Check for unreferenced words (warning, not error)
  const unreferencedWords = wordBank.filter(word => {
    return !Object.values(answers).some(ans => 
      ans.word_id === word.id || ans.word_value === word.value
    );
  });
  
  if (unreferencedWords.length > 0) {
    console.warn(`Word bank contains ${unreferencedWords.length} unused words`);
  }
  
  return null;
};
```

**Frontend Delete Protection:**
```javascript
// SummaryBuilder.jsx - Enhanced handleRemoveWordFromBank
const handleRemoveWordFromBank = useCallback((wordItem) => {
  // ✅ Check if word is referenced
  const isReferenced = Object.values(answers).some(value => 
    value === wordItem.value || value === wordItem.id
  );
  
  if (isReferenced) {
    const blankIds = Object.keys(answers).filter(key =>
      answers[key] === wordItem.value || answers[key] === wordItem.id
    );
    
    const confirmMsg = `"${wordItem.text}" is used in blank(s): ${blankIds.join(', ')}. ` +
                      `Deleting it will clear those answers. Continue?`;
    
    if (!confirm(confirmMsg)) {
      return;
    }
  }
  
  // Proceed with deletion...
}, [wordItem, answers]);
```

---

### Solution 4: **Student Answer Merge Strategy**

```python
# backend/apps/mocks/views.py - Enhanced submission logic

from django.db import transaction
from django.utils import timezone

class StudentAnswerViewSet(viewsets.ModelViewSet):
    
    @transaction.atomic
    def create_or_update_answer(self, request):
        """
        Handle partial submissions for grouped questions
        Merge strategy: preserve existing sub-answers
        """
        question_id = request.data.get('question_id')
        student_id = request.user.id
        new_answer_data = request.data.get('answer_data', {})
        
        # Get existing answer or create new
        answer, created = StudentAnswer.objects.get_or_create(
            question_id=question_id,
            student_id=student_id,
            defaults={'answer_data': {}}
        )
        
        if not created:
            # ✅ MERGE instead of replace
            existing_data = answer.answer_data or {}
            
            # Update with new answers, preserving old ones
            for sub_q, value in new_answer_data.items():
                existing_data[sub_q] = {
                    'value': value,
                    'timestamp': timezone.now().isoformat()
                }
            
            answer.answer_data = existing_data
        else:
            # New answer, just set it
            answer.answer_data = {
                sub_q: {
                    'value': value,
                    'timestamp': timezone.now().isoformat()
                }
                for sub_q, value in new_answer_data.items()
            }
        
        # Check if all sub-questions answered
        question = MockQuestion.objects.get(id=question_id)
        expected_sub_questions = set(str(i) for i in range(
            question.question_number_start,
            question.question_number_end + 1
        ))
        answered_sub_questions = set(answer.answer_data.keys())
        
        answer.is_partial = not expected_sub_questions.issubset(answered_sub_questions)
        answer.last_updated = timezone.now()
        answer.save()
        
        return Response({
            'success': True,
            'is_partial': answer.is_partial,
            'answered': list(answered_sub_questions),
            'remaining': list(expected_sub_questions - answered_sub_questions)
        })
```

---

### Solution 5: **API Optimization & Pagination**

```python
# backend/apps/mocks/serializers.py

class PassageSerializer(serializers.ModelSerializer):
    """Lightweight passage representation"""
    class Meta:
        model = Passage
        fields = ['id', 'passage_type', 'content', 'metadata']

class QuestionListSerializer(serializers.ModelSerializer):
    """Minimal question data for list views"""
    class Meta:
        model = MockQuestion
        fields = ['id', 'question_type', 'question_number_start', 
                  'question_number_end', 'passage_id']

class QuestionDetailSerializer(serializers.ModelSerializer):
    """Full question data for detail view"""
    passage = PassageSerializer(read_only=True)
    
    class Meta:
        model = MockQuestion
        fields = '__all__'

# backend/apps/mocks/views.py

class MockQuestionViewSet(viewsets.ModelViewSet):
    
    def list(self, request):
        """
        Optimized list endpoint with pagination
        GET /api/mock-questions/?section_id=123&page=1&page_size=10
        """
        section_id = request.query_params.get('section_id')
        
        queryset = MockQuestion.objects.filter(
            section_id=section_id
        ).select_related('passage')  # ✅ Avoid N+1 queries
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = QuestionListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = QuestionListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def with_passages(self, request):
        """
        Optimized endpoint that returns passages + questions together
        GET /api/mock-questions/with_passages/?section_id=123
        
        Returns:
        {
          "passages": [...],
          "questions": [...]
        }
        """
        section_id = request.query_params.get('section_id')
        
        questions = MockQuestion.objects.filter(
            section_id=section_id
        ).select_related('passage')
        
        # Group by passage to minimize duplication
        passages_map = {}
        questions_data = []
        
        for q in questions:
            if q.passage_id and q.passage_id not in passages_map:
                passages_map[q.passage_id] = PassageSerializer(q.passage).data
            
            q_data = QuestionListSerializer(q).data
            q_data['passage_id'] = q.passage_id  # Reference only
            questions_data.append(q_data)
        
        return Response({
            'passages': list(passages_map.values()),
            'questions': questions_data,
            'total_count': len(questions_data)
        })
```

**Frontend API Client:**
```javascript
// utils/apiClient.js

export const fetchSectionQuestions = async (sectionId) => {
  const response = await authAxios.get(
    `/mock-questions/with_passages/?section_id=${sectionId}`
  );
  
  const { passages, questions } = response.data;
  
  // Build lookup map for efficient access
  const passageMap = {};
  passages.forEach(p => {
    passageMap[p.id] = p;
  });
  
  // Attach passages to questions
  const enrichedQuestions = questions.map(q => ({
    ...q,
    passage: q.passage_id ? passageMap[q.passage_id] : null
  }));
  
  return enrichedQuestions;
};
```

---

## 📊 **IMPACT ANALYSIS**

### Before vs After:

| Metric | Current (Before) | Proposed (After) | Improvement |
|--------|------------------|------------------|-------------|
| **DB Storage (40Q mock)** | ~140KB | ~60KB | **57% reduction** |
| **API Payload Size** | 140KB+ | 65KB | **54% reduction** |
| **Passage Duplication** | 5× for Q1-Q5 | 1× (referenced) | **80% reduction** |
| **Answer Variants Support** | ❌ No | ✅ Yes | **IELTS compliant** |
| **Orphaned Answer Risk** | ❌ High | ✅ Protected | **Data integrity** |
| **Student Answer Collision** | ⚠️ Possible | ✅ Merge strategy | **Safe partial saves** |

---

## 🎯 **IMPLEMENTATION PRIORITY**

### Phase 1: Critical (Immediate)
1. **Answer Variants for SHORT_ANSWER** - Affects scoring accuracy
2. **Word Bank Orphan Protection** - Prevents data corruption
3. **Student Answer Merge Strategy** - Prevents data loss

### Phase 2: High Priority (2 weeks)
4. **Passage Normalization** - Reduces storage/bandwidth
5. **API Pagination** - Improves performance

### Phase 3: Nice to Have (1 month)
6. **Advanced matching rules** (fuzzy matching, Levenshtein distance)
7. **Answer variation analytics** (track which variants students use most)

---

## 📝 **MIGRATION PLAN**

```sql
-- 1. Create Passage table
CREATE TABLE passages (
    id UUID PRIMARY KEY,
    section_id UUID REFERENCES sections(id),
    passage_type VARCHAR(50),
    content TEXT,
    display_order INT,
    metadata JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 2. Migrate existing prompts to passages
INSERT INTO passages (id, section_id, passage_type, content, display_order)
SELECT 
    gen_random_uuid(),
    section_id,
    'READING_TEXT',
    prompt,
    question_number_start
FROM mock_questions
WHERE question_type IN ('MCQ_SINGLE', 'TFNG', 'SUMMARY_FILL_BLANKS')
    AND question_number_end > question_number_start
GROUP BY section_id, prompt, question_number_start;

-- 3. Add passage_id column to questions
ALTER TABLE mock_questions ADD COLUMN passage_id UUID REFERENCES passages(id);

-- 4. Link questions to passages
UPDATE mock_questions q
SET passage_id = p.id
FROM passages p
WHERE q.section_id = p.section_id 
    AND q.prompt = p.content
    AND q.question_type IN ('MCQ_SINGLE', 'TFNG', 'SUMMARY_FILL_BLANKS');

-- 5. Clear duplicate prompts
UPDATE mock_questions
SET prompt = ''
WHERE passage_id IS NOT NULL;
```

---

## ✅ **RECOMMENDED JSON SCHEMAS**

### Enhanced Question Content Schema:
```typescript
// content field structure
type QuestionContent = {
  // For MCQ/TFNG with shared passage
  passage_id?: string;  // ✅ Reference to passage table
  
  // Question-specific content
  statements?: string[];
  options?: Array<{
    id: string;
    value: string;
    text: string;
  }>;
  
  // For SUMMARY types
  summary_type?: 'story' | 'bullet' | 'numbered';
  rows?: Array<{
    id: string;
    type: 'question' | 'heading' | 'text';
    pre_text?: string;
    blank_id?: string;
    post_text?: string;
  }>;
  word_bank?: Array<{
    id: string;
    text: string;
    value: string;
    is_referenced: boolean;  // ✅ Computed
    reference_count: number;  // ✅ Computed
  }>;
};
```

### Enhanced Answer Schema:
```typescript
// correct_answer field structure
type CorrectAnswer = {
  // For single answers
  value?: string;
  
  // For grouped answers
  values?: Record<string, AnswerValue>;
  
  // For MCQ multiple
  values?: string[];
  
  // For matching
  pairs?: Array<{ list_a_id: string; list_b_id: string }>;
};

type AnswerValue = string | {
  primary: string;
  accepted_variants?: Array<{
    value: string;
    score_percentage: number;
  }>;
  matching_rules?: {
    case_sensitive: boolean;
    trim_whitespace: boolean;
    allow_punctuation_variance: boolean;
  };
};
```

---

**Status:** 🔴 **CRITICAL REVIEW REQUIRED**  
**Next Steps:** Backend team should review and approve schema changes before frontend implementation.

