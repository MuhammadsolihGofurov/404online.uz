# Data Architecture: Current vs Proposed

## 🔴 CURRENT ARCHITECTURE (PROBLEMATIC)

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOCK_QUESTIONS TABLE                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Question 1      │  │  Question 2      │  │  Question 3      │
│  Q1 (MCQ_SINGLE) │  │  Q2 (MCQ_SINGLE) │  │  Q3 (MCQ_SINGLE) │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ prompt:          │  │ prompt:          │  │ prompt:          │
│ "<p>Long IELTS   │  │ "<p>Long IELTS   │  │ "<p>Long IELTS   │
│ reading passage  │  │ reading passage  │  │ reading passage  │
│ 3000 words...    │  │ 3000 words...    │  │ 3000 words...    │
│ </p>"            │  │ </p>"            │  │ </p>"            │
│                  │  │                  │  │                  │
│ content:         │  │ content:         │  │ content:         │
│ { statements:... }│  │ { statements:... }│  │ { statements:... }│
│                  │  │                  │  │                  │
│ correct_answer:  │  │ correct_answer:  │  │ correct_answer:  │
│ { value: "A" }   │  │ { value: "B" }   │  │ { value: "C" }   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
   3.5 KB              3.5 KB               3.5 KB
   
   ❌ TOTAL: 10.5 KB for 3 questions sharing same passage
   ❌ Passage duplicated 3× in database
   ❌ If admin edits Q1 passage, Q2 and Q3 are inconsistent
```

### Current Answer Structure (SHORT_ANSWER):
```json
// ❌ CURRENT: No variants support
{
  "correct_answer": {
    "value": "bus stop"
  }
}

// Student writes "bus-stop" → ❌ INCORRECT (0 points)
// Student writes "Bus Stop" → ❌ INCORRECT (0 points)
// Student writes "bus station" → ❌ INCORRECT (0 points)
```

---

## ✅ PROPOSED ARCHITECTURE (OPTIMIZED)

```
┌─────────────────────────────────────────────────────────────────┐
│                          PASSAGES TABLE                          │
└─────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│ Passage 1                                                        │
│ id: passage_uuid_123                                             │
│ section_id: section_456                                          │
│ passage_type: "READING_TEXT"                                     │
│ content: "<p>Long IELTS reading passage 3000 words...</p>"       │
│ display_order: 1                                                 │
└──────────────────────────────────────────────────────────────────┘
                            3 KB (stored once)
                                  │
                                  │ (referenced by)
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Question 1      │  │  Question 2      │  │  Question 3      │
│  Q1 (MCQ_SINGLE) │  │  Q2 (MCQ_SINGLE) │  │  Q3 (MCQ_SINGLE) │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ passage_id:      │  │ passage_id:      │  │ passage_id:      │
│ passage_uuid_123 │  │ passage_uuid_123 │  │ passage_uuid_123 │
│                  │  │                  │  │                  │
│ prompt:          │  │ prompt:          │  │ prompt:          │
│ "<p>Based on     │  │ "<p>According to │  │ "<p>The author   │
│ passage...</p>"  │  │ paragraph 2...</p>"│  │ suggests...</p>" │
│                  │  │                  │  │                  │
│ content:         │  │ content:         │  │ content:         │
│ { statements:... }│  │ { statements:... }│  │ { statements:... }│
│                  │  │                  │  │                  │
│ correct_answer:  │  │ correct_answer:  │  │ correct_answer:  │
│ { value: "A" }   │  │ { value: "B" }   │  │ { value: "C" }   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
   500 B              500 B                500 B
   
   ✅ TOTAL: 3 KB (passage) + 1.5 KB (questions) = 4.5 KB
   ✅ 57% reduction in storage
   ✅ Edit passage once, affects all questions
   ✅ API can cache passage separately
```

### Proposed Answer Structure (SHORT_ANSWER):
```json
// ✅ PROPOSED: Full variants support
{
  "correct_answer": {
    "primary": "bus stop",
    "accepted_variants": [
      { "value": "bus-stop", "score_percentage": 100 },
      { "value": "bus station", "score_percentage": 100 },
      { "value": "busstop", "score_percentage": 0 }
    ],
    "matching_rules": {
      "case_sensitive": false,
      "trim_whitespace": true,
      "allow_punctuation_variance": true
    }
  }
}

// Student writes "bus-stop" → ✅ CORRECT (100 points)
// Student writes "Bus Stop" → ✅ CORRECT (100 points)
// Student writes "bus station" → ✅ CORRECT (100 points)
// Student writes "busstop" → ❌ INCORRECT (0 points, explicitly rejected)
```

---

## 🔄 STUDENT ANSWER FLOW

### ❌ Current (Risky):
```
Student Session:
  1. Answers Q1, Q2, Q3 → Submit → Saved
  2. Navigates to different section
  3. Comes back to Q1-Q5 group
  4. Answers Q4, Q5 → Submit
  
Backend behavior (UNCLEAR):
  Option A: REPLACE → Q1, Q2, Q3 answers lost ❌
  Option B: MERGE → All answers preserved ✅
  
Current implementation: Unknown! Need to verify.
```

### ✅ Proposed (Safe Merge Strategy):
```python
# backend/apps/mocks/views.py
@transaction.atomic
def save_student_answer(request):
    existing_answer = StudentAnswer.objects.get(
        question_id=question_id,
        student_id=student_id
    )
    
    # ✅ MERGE instead of replace
    existing_data = existing_answer.answer_data or {}
    new_data = request.data['answer_data']
    
    for sub_q, value in new_data.items():
        existing_data[sub_q] = {
            'value': value,
            'timestamp': timezone.now().isoformat()
        }
    
    existing_answer.answer_data = existing_data
    existing_answer.save()
```

---

## 🗂️ WORD BANK REFERENTIAL INTEGRITY

### ❌ Current (Orphan Risk):

```
Step 1: Admin creates word bank
┌──────────────────────────────────────┐
│ Word Bank:                           │
│ 1. apple   [Delete]                  │
│ 2. banana  [Delete]                  │
│ 3. orange  [Delete]                  │
└──────────────────────────────────────┘

Step 2: Admin sets correct answers
┌──────────────────────────────────────┐
│ Blank 1: apple    ✓                  │
│ Blank 2: orange   ✓                  │
└──────────────────────────────────────┘

Step 3: Admin clicks [Delete] on "apple"
┌──────────────────────────────────────┐
│ Word Bank:                           │
│ 1. banana  [Delete]                  │
│ 2. orange  [Delete]                  │
└──────────────────────────────────────┘
            ↓
❌ Blank 1 still references "apple" (orphaned!)
❌ Question validation will fail
❌ Students can't submit answers
```

### ✅ Proposed (Protected):

```
Step 1: Admin creates word bank
┌──────────────────────────────────────┐
│ Word Bank:                           │
│ 1. apple   [Delete]                  │
│ 2. banana  [Delete]                  │
│ 3. orange  [Delete]                  │
└──────────────────────────────────────┘

Step 2: Admin sets correct answers
┌──────────────────────────────────────┐
│ Blank 1: apple    ✓                  │
│ Blank 2: orange   ✓                  │
└──────────────────────────────────────┘

Step 3: UI updates to show usage
┌──────────────────────────────────────┐
│ Word Bank:                           │
│ 1. apple   🔵 Used in 1 blank [⚠️]   │
│ 2. banana  [Delete]                  │
│ 3. orange  🔵 Used in 1 blank [⚠️]   │
└──────────────────────────────────────┘

Step 4: Admin clicks [⚠️] on "apple"
┌─────────────────────────────────────┐
│ ⚠️ WARNING                          │
│                                     │
│ "apple" is used in:                 │
│ • Blank 1                           │
│                                     │
│ Deleting it will clear these        │
│ answers. Continue?                  │
│                                     │
│  [Cancel]  [Delete & Clear Answers] │
└─────────────────────────────────────┘

✅ Admin is warned before deletion
✅ Orphaned answers automatically cleared
✅ Question remains valid
```

---

## 📊 API PAYLOAD COMPARISON

### Current API Call:
```
GET /api/mock-questions/?section_id=123

Response: [
  {
    id: 1,
    prompt: "<p>3000 word passage...</p>",  // 3 KB
    content: {...},  // 500 B
    correct_answer: {...}  // 100 B
  },
  {
    id: 2,
    prompt: "<p>3000 word passage...</p>",  // 3 KB (duplicate!)
    content: {...},
    correct_answer: {...}
  },
  // ... 40 more questions
]

Total payload: ~140 KB
Network time (3G): ~2-3 seconds
```

### Proposed API Call:
```
GET /api/mock-questions/with_passages/?section_id=123

Response: {
  passages: [
    {
      id: "passage_123",
      content: "<p>3000 word passage...</p>",  // 3 KB (once!)
      passage_type: "READING_TEXT"
    }
  ],
  questions: [
    {
      id: 1,
      passage_id: "passage_123",  // Reference only!
      prompt: "<p>Based on passage...</p>",  // 200 B
      content: {...}
    },
    {
      id: 2,
      passage_id: "passage_123",  // Same reference
      prompt: "<p>According to...</p>",
      content: {...}
    }
    // ... 40 more questions
  ]
}

Total payload: ~65 KB
Network time (3G): ~1 second
Improvement: 54% faster, 54% less data
```

---

## 🎯 DATABASE QUERY OPTIMIZATION

### ❌ Current (N+1 Problem):
```python
# Inefficient
questions = MockQuestion.objects.filter(section_id=123)
for question in questions:
    # Each iteration hits DB again for related data
    passage = question.passage  # N+1 query!
    
# Total queries: 1 + 40 = 41 queries
```

### ✅ Proposed (Optimized):
```python
# Efficient
questions = MockQuestion.objects.filter(
    section_id=123
).select_related('passage')  # Join in single query

for question in questions:
    passage = question.passage  # Already loaded!
    
# Total queries: 1 query (with JOIN)
```

---

## 📈 STORAGE GROWTH PROJECTION

### Scenario: 1000 students, 100 mocks, 40 questions/mock

#### Current Architecture:
```
Questions: 100 mocks × 40 questions × 3.5 KB = 14 MB
Student Answers: 1000 students × 100 mocks × 40 questions × 200 B = 800 MB

Total: ~814 MB

After 1 year (10,000 students):
Questions: 14 MB (same)
Student Answers: 8 GB
Total: ~8 GB
```

#### Proposed Architecture:
```
Passages: 100 mocks × 5 passages × 3 KB = 1.5 MB
Questions: 100 mocks × 40 questions × 500 B = 2 MB
Student Answers: 1000 students × 100 mocks × 40 questions × 200 B = 800 MB

Total: ~803.5 MB (1.3% reduction)

After 1 year (10,000 students):
Passages: 1.5 MB
Questions: 2 MB
Student Answers: 8 GB
Total: ~8.003 GB

Savings: 
- Initial: 10.5 MB saved
- At scale: Storage grows linearly, not exponentially
- API bandwidth: 54% reduction per request
```

---

## 🔄 MIGRATION PATH

```
┌─────────────────────┐
│ Current Production  │
│ (Legacy format)     │
└──────────┬──────────┘
           │
           │ Step 1: Deploy backward-compatible code
           │         (reads both old & new formats)
           ▼
┌─────────────────────┐
│ Hybrid State        │
│ (Both formats work) │
└──────────┬──────────┘
           │
           │ Step 2: Run migration script
           │         (convert old → new)
           ▼
┌─────────────────────┐
│ Migrated State      │
│ (Still reads both)  │
└──────────┬──────────┘
           │
           │ Step 3: Verify all data migrated
           │         (100% in new format)
           ▼
┌─────────────────────┐
│ New Production      │
│ (New format only)   │
└─────────────────────┘

⏱️ Total migration time: ~2 hours downtime
✅ Zero data loss
✅ Rollback available at any step
```

---

## 📋 IMPLEMENTATION PRIORITY MATRIX

```
┌─────────────────────────────────────────────────────┐
│               HIGH IMPACT                           │
│                    │                                │
│  ┌─────────────────┼─────────────────┐             │
│  │ 1. Answer       │ 4. Passage      │             │
│  │    Variants     │    Normalization│             │
│  │ ⚡ CRITICAL     │ 💰 HIGH ROI     │             │
│  │ Blocks scoring  │ 54% bandwidth ↓ │             │
│  ├─────────────────┼─────────────────┤             │
│  │ 2. Word Bank    │ 5. API          │             │
│  │    Protection   │    Pagination   │             │
│  │ 🔒 Data Safety  │ 🚀 Performance  │             │
│  ├─────────────────┼─────────────────┤             │
│  │ 3. Answer       │ 6. Advanced     │             │
│  │    Merge        │    Matching     │             │
│  │ 💾 Prevents     │ ⭐ Nice to      │  LOW IMPACT │
│  │    Data Loss    │    Have         │             │
│  └─────────────────┴─────────────────┘             │
│   LOW EFFORT          HIGH EFFORT                  │
└─────────────────────────────────────────────────────┘

RECOMMENDATION:
- Week 1: Items 1, 2, 3 (critical fixes)
- Week 2-3: Items 4, 5 (optimization)
- Month 2+: Item 6 (enhancement)
```

---

## ✅ SUCCESS METRICS

After implementation, measure:

1. **Storage Efficiency**
   - Target: 50%+ reduction in question data size
   - Measure: `SELECT pg_size_pretty(pg_total_relation_size('mock_questions'))`

2. **API Performance**
   - Target: <100ms response time for question list
   - Target: <200ms for full questions with passages
   - Measure: New Relic/DataDog metrics

3. **Data Integrity**
   - Target: Zero orphaned answer records
   - Target: 100% answer variant coverage for SHORT_ANSWER
   - Measure: Weekly data quality audits

4. **Student Experience**
   - Target: 95%+ correct scoring (with variants)
   - Target: Zero "lost answer" complaints
   - Measure: Support ticket analysis

---

**Legend:**
- 🔴 Current (Problematic)
- ✅ Proposed (Optimized)
- ❌ Risk/Problem
- ⚠️ Warning
- 🔵 Active/In Use
- ⚡ Critical Priority
- 💰 High ROI
- 🔒 Data Safety
- 🚀 Performance
- 💾 Data Protection
- ⭐ Enhancement

