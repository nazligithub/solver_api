# Homework API Documentation

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### 1. Solve Homework
**POST** `/homework/solve`

Uploads an image of a homework problem and returns a step-by-step solution.

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `image` (file, required): The homework problem image
- `user_id` (string, required): User identifier  
- `locale` (string, optional): Language code (default: 'tr'). Supported: tr, en, es, fr, de, it, pt, ru, ja, zh, ar
- `subject` (string, optional): Subject of the homework (e.g., 'mathematics', 'physics', 'chemistry')
- `grade_level` (string, optional): Grade level (e.g., '5th grade', '10th grade')

**Success Response (200):**
```json
{
  "success": true,
  "message": "Homework solved successfully",
  "data": {
    "submission_id": 123,
    "image_url": "https://...",
    "result": "x = 5",
    "steps": [
      {
        "step": 1,
        "title": "Problem Identification",
        "explanation": "Given equation: 2x + 5 = 15",
        "math": "2x + 5 = 15",
        "visual": null
      },
      {
        "step": 2,
        "title": "Isolate Variable",
        "explanation": "Subtract 5 from both sides",
        "math": "2x = 10",
        "visual": null
      },
      {
        "step": 3,
        "title": "Solve for x",
        "explanation": "Divide both sides by 2",
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

### 2. Get History
**GET** `/homework/history?user_id={user_id}`

Retrieves the user's homework submission history.

**Query Parameters:**
- `user_id` (string, required): User identifier

**Success Response (200):**
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
        "image_url": "https://...",
        "solution": "x = 5",
        "confidence": 0.95,
        "methodology": "algebraic"
      }
    ]
  }
}
```

### 3. Get Submission Details
**GET** `/homework/submission/{id}`

Retrieves detailed information about a specific homework submission.

**Path Parameters:**
- `id` (integer, required): Submission ID

**Success Response (200):**
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
    "image_url": "https://...",
    "created_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:30:02Z",
    "processing_time_ms": 2500,
    "solution": {
      "text": "x = 5",
      "steps": [...],
      "confidence": 0.95,
      "methodology": "algebraic",
      "solved_at": "2024-01-15T10:30:02Z"
    }
  }
}
```

### 4. Get User Statistics
**GET** `/homework/stats?user_id={user_id}`

Retrieves statistics about the user's homework submissions.

**Query Parameters:**
- `user_id` (string, required): User identifier

**Success Response (200):**
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
      }
    ]
  }
}
```

## Chat API (Preserved)

### Send Message
**POST** `/chat/send`

### Get Conversations
**GET** `/chat/conversations?user_id={user_id}`

### Get Conversation
**GET** `/chat/conversations/{id}`

### Create Conversation
**POST** `/chat/conversations`

### Delete Conversation
**DELETE** `/chat/conversations/{id}`

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "User ID is required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Submission not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to solve homework problem"
}
```

## Testing with cURL

### Example: Solve Homework
```bash
curl -X POST http://localhost:3000/api/homework/solve \
  -F "image=@/path/to/homework.jpg" \
  -F "user_id=test123" \
  -F "locale=tr" \
  -F "subject=mathematics" \
  -F "grade_level=8th grade"
```

### Example: Get History
```bash
curl http://localhost:3000/api/homework/history?user_id=test123
```

## Flutter Integration Example

```dart
Future<void> solveHomework(File imageFile) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('http://localhost:3000/api/homework/solve'),
  );
  
  request.fields['user_id'] = 'user123';
  request.fields['locale'] = 'tr';
  request.fields['subject'] = 'mathematics';
  
  request.files.add(
    await http.MultipartFile.fromPath('image', imageFile.path),
  );
  
  var response = await request.send();
  var responseData = await response.stream.bytesToString();
  var json = jsonDecode(responseData);
  
  if (json['success']) {
    // Handle solution
    print('Solution: ${json['data']['result']}');
    // Display steps
    for (var step in json['data']['steps']) {
      print('Step ${step['step']}: ${step['explanation']}');
    }
  }
}
```