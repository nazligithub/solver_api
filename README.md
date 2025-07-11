# Homework Solver API 🎓

An AI-powered homework solving API that uses Google Gemini to analyze homework images and provide step-by-step solutions in multiple languages.

## Features ✨

- 📸 **Image-based homework solving** - Upload an image of any homework problem
- 🌍 **Multi-language support** - Available in 11 languages (TR, EN, ES, FR, DE, IT, PT, RU, JA, ZH, AR)
- 📝 **Step-by-step solutions** - Detailed explanations with mathematical formulas in LaTeX
- 💬 **Chat system** - Interactive chat for educational assistance
- 📊 **User statistics** - Track homework submissions and performance
- 🚀 **Fast processing** - Powered by Gemini 2.5 Flash

## Tech Stack 🛠️

- **Backend**: Node.js + Express
- **AI**: Google Gemini AI
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Image Processing**: Sharp + Multer

## Installation 📦

1. Clone the repository:
```bash
git clone <repository-url>
cd home-work
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
DATABASE_URL=your_database_url
```

4. Run database migrations:
```bash
# Execute homework_tables.sql in your Supabase SQL editor
```

5. Start the server:
```bash
npm run dev
```

## API Endpoints 📡

### Base URL
```
http://localhost:3000/api
```

---

## 1️⃣ Solve Homework

Analyzes a homework image and returns a detailed solution with step-by-step explanations.

### Request
| Method | Endpoint | Content-Type |
|--------|----------|--------------|
| POST | `/homework/solve` | multipart/form-data |

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image | file | ✅ | Homework problem image (JPG, PNG) |
| user_id | string | ✅ | Unique user identifier |
| locale | string | ❌ | Language code (default: 'tr') |
| subject | string | ❌ | Subject (e.g., 'mathematics', 'physics') |
| grade_level | string | ❌ | Grade level (e.g., '8th grade') |

### Example Request
```bash
curl -X POST http://localhost:3000/api/homework/solve \
  -F "image=@homework.jpg" \
  -F "user_id=user123" \
  -F "locale=tr" \
  -F "subject=mathematics" \
  -F "grade_level=8th grade"
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Homework solved successfully",
  "data": {
    "submission_id": 123,
    "image_url": "https://your-storage.supabase.co/...",
    "result": "x = 5",
    "steps": [
      {
        "step": 1,
        "title": "Problem Tanımlama",
        "explanation": "Verilen denklem: 2x + 5 = 15",
        "math": "2x + 5 = 15",
        "visual": null
      },
      {
        "step": 2,
        "title": "İşlem Adımı",
        "explanation": "Her iki taraftan 5 çıkarıyoruz",
        "math": "2x + 5 - 5 = 15 - 5",
        "visual": null
      },
      {
        "step": 3,
        "title": "Sadeleştirme",
        "explanation": "Sadeleştirme sonucu",
        "math": "2x = 10",
        "visual": null
      },
      {
        "step": 4,
        "title": "Çözüm",
        "explanation": "Her iki tarafı 2'ye bölüyoruz",
        "math": "x = 5",
        "visual": null
      }
    ],
    "confidence": 0.95,
    "methodology": "algebraic",
    "processing_time_ms": 2500
  }
}
```

---

## 2️⃣ Get User History

Retrieves the homework submission history for a specific user.

### Request
| Method | Endpoint | Parameters |
|--------|----------|------------|
| GET | `/homework/history` | user_id (query) |

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | ✅ | User identifier |

### Example Request
```bash
curl "http://localhost:3000/api/homework/history?user_id=user123"
```

### Success Response (200)
```json
{
  "success": true,
  "message": "History retrieved successfully",
  "data": {
    "submissions": [
      {
        "id": 123,
        "subject": "mathematics",
        "grade_level": "8th grade",
        "status": "completed",
        "locale": "tr",
        "created_at": "2024-01-15T10:30:00Z",
        "processing_time_ms": 2500,
        "image_url": "https://your-storage.supabase.co/...",
        "solution": "x = 5",
        "confidence": 0.95,
        "methodology": "algebraic"
      },
      {
        "id": 122,
        "subject": "physics",
        "grade_level": "9th grade",
        "status": "completed",
        "locale": "tr",
        "created_at": "2024-01-14T15:20:00Z",
        "processing_time_ms": 3200,
        "image_url": "https://your-storage.supabase.co/...",
        "solution": "F = 50N",
        "confidence": 0.92,
        "methodology": "analytical"
      }
    ]
  }
}
```

---

## 3️⃣ Get Submission Details

Retrieves detailed information about a specific homework submission.

### Request
| Method | Endpoint | Parameters |
|--------|----------|------------|
| GET | `/homework/submission/:id` | id (path) |

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | ✅ | Submission ID |

### Example Request
```bash
curl "http://localhost:3000/api/homework/submission/123"
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Submission retrieved successfully",
  "data": {
    "id": 123,
    "user_id": "user123",
    "subject": "mathematics",
    "grade_level": "8th grade",
    "status": "completed",
    "locale": "tr",
    "image_url": "https://your-storage.supabase.co/...",
    "created_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:30:02Z",
    "processing_time_ms": 2500,
    "solution": {
      "text": "x = 5",
      "steps": [
        {
          "step_number": 1,
          "title": "Problem Tanımlama",
          "explanation": "Verilen denklem: 2x + 5 = 15",
          "latex": "2x + 5 = 15",
          "visual_aid": null
        },
        {
          "step_number": 2,
          "title": "İşlem Adımı",
          "explanation": "Her iki taraftan 5 çıkarıyoruz",
          "latex": "2x = 10",
          "visual_aid": null
        }
      ],
      "confidence": 0.95,
      "methodology": "algebraic",
      "solved_at": "2024-01-15T10:30:02Z"
    }
  }
}
```

---

## 4️⃣ Get User Statistics

Retrieves homework statistics for a specific user.

### Request
| Method | Endpoint | Parameters |
|--------|----------|------------|
| GET | `/homework/stats` | user_id (query) |

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | ✅ | User identifier |

### Example Request
```bash
curl "http://localhost:3000/api/homework/stats?user_id=user123"
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Stats retrieved successfully",
  "data": {
    "total_submissions": 50,
    "completed_submissions": 48,
    "failed_submissions": 2,
    "avg_processing_time_ms": 2300,
    "unique_subjects": 5,
    "top_subjects": [
      {
        "subject": "mathematics",
        "count": 25
      },
      {
        "subject": "physics",
        "count": 15
      },
      {
        "subject": "chemistry",
        "count": 8
      }
    ]
  }
}
```

---

## 💬 Chat Endpoints

The API also includes a chat system for educational assistance.

### Chat Endpoints Summary
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/send` | Send a message |
| GET | `/chat/conversations` | Get all conversations |
| GET | `/chat/conversations/:id` | Get specific conversation |
| POST | `/chat/conversations` | Create new conversation |
| DELETE | `/chat/conversations/:id` | Delete conversation |

---

## Error Responses ❌

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "User ID is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Submission not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to solve homework problem"
}
```

---

## Supported Languages 🌐

| Code | Language | Example Locale |
|------|----------|----------------|
| tr | Turkish | tr-TR |
| en | English | en-US |
| es | Spanish | es-ES |
| fr | French | fr-FR |
| de | German | de-DE |
| it | Italian | it-IT |
| pt | Portuguese | pt-PT |
| ru | Russian | ru-RU |
| ja | Japanese | ja-JP |
| zh | Chinese | zh-CN |
| ar | Arabic | ar-SA |

---

## Flutter Integration Example 📱

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';

class HomeworkService {
  final String baseUrl = 'http://localhost:3000/api';
  
  Future<Map<String, dynamic>> solveHomework({
    required File imageFile,
    required String userId,
    String locale = 'tr',
    String? subject,
    String? gradeLevel,
  }) async {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/homework/solve'),
    );
    
    request.fields['user_id'] = userId;
    request.fields['locale'] = locale;
    if (subject != null) request.fields['subject'] = subject;
    if (gradeLevel != null) request.fields['grade_level'] = gradeLevel;
    
    request.files.add(
      await http.MultipartFile.fromPath('image', imageFile.path),
    );
    
    var response = await request.send();
    var responseData = await response.stream.bytesToString();
    return jsonDecode(responseData);
  }
  
  Future<Map<String, dynamic>> getHistory(String userId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/homework/history?user_id=$userId'),
    );
    return jsonDecode(response.body);
  }
}
```

---

## Database Schema 📊

### homework_submissions
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(100) | User identifier |
| subject | VARCHAR(50) | Subject name |
| grade_level | VARCHAR(20) | Grade level |
| image_id | INTEGER | Reference to image_uploads |
| locale | VARCHAR(10) | Language code |
| status | VARCHAR(20) | Processing status |
| created_at | TIMESTAMP | Submission time |

### homework_solutions
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| submission_id | INTEGER | Reference to submission |
| solution_text | TEXT | Final answer |
| steps | JSONB | Step-by-step solution |
| confidence_score | DECIMAL | AI confidence (0-1) |
| methodology | VARCHAR(100) | Solution approach |

---

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License 📄

This project is licensed under the ISC License.

---

## Support 💬

For questions or issues, please open an issue on GitHub or contact the development team.

---

Made with ❤️ for students everywhere