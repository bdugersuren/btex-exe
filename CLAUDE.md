# BTEC IT Assignment Evaluator - Comprehensive System Documentation

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Ready for Development with Claude Code Extension

---

## 📋 Гарчиг (Table of Contents)

1. [Системийн үндсэн зорилго](#системийн-үндсэн-зорилго)
2. [Үндсэн зарчимууд](#үндсэн-зарчимууд)
3. [Технологи сонголт](#технологи-сонголт)
4. [Системийн архитектур](#системийн-архитектур)
5. [Файлын бүтэц](#файлын-бүтэц)
6. [Өгөгдлийн загварчлал](#өгөгдлийн-загварчлал)
7. [API загварчлал](#api-загварчлал)
8. [State Management загварчлал](#state-management-загварчлал)
9. [Үйл явцын урсгал](#үйл-явцын-урсгал)
10. [Хөгжүүлэлтийн алхамууд](#хөгжүүлэлтийн-алхамууд)

---

## 🎯 Системийн үндсэн зорилго

### Эхний зорилго
Pearson BTEC International Level 3 Information Technology хичээлийн бүхий л процессийг удирдах, assignment үүсгэх, оюутны submission хүлээн авах, Gemini AI-аар автомат үнэлэх, багш хянах, IV/Lead IV баталгаажуулах, баримт үүсгэх, гарын үсэг зурах — бүх үйлдлийг нэг системд автоматжуулна.

### Системийн хийх үйлдлүүд
0. Багш өөрийн ордог хичээлийг оруулахдаа хичээлийн нэр, ашиглагдах матермал зэргийг оруулахын зэрэгцээ assignment-ийн дагуу PSA-ийг дэлгэрэнгүй оруулах(даалгавар, үнэлгээний шалгуурууд) даалгавар болон үнэлгээний шалгуурыг англи болон монгол хэл дээр оруулж өгөх
1. Сурагч багшийн үүсгэсэн assignment-ийн дагуу нэг удаа тайлангаа илгээх
2. систем нь сурагчийн илгээсэн тайлан бүрийг багш, болон суагч өөрөө download хийж авах боломжтой байдлаар хадгалах - PDF, DOCX, TXT форматуудаас
3. Багш тухайн сурагчийн тайланг сонгон "AI -аар үнэлгээ хийлгэх" товч дарж тухайн unit-д оруулсан шалгуурын дагуу үнэлгээ хийлгэх боломжтой байх
4. Үнэлгээ хийсний дараа багш AI -аар хийсэн үнэлгээг хянаж засварлаад сурагч руу илгээх боломжтой байх
5. Сурагч тухайн үнэлгээтэй танилцаад санал хүсэлт бичих боломжтой байх
6. Сурагч тухайн үнэлгээтэй танилцаад дахин resubmit хийх зөвшөөрөл хүсэх боломжтой байх (тодорхой хугацааны дотор хүчинтэй байх ба хугацаа өнгөрсөн тохиолдолд хүсэлт илгээх боломжгүй байх)
7. Багш сурагчийн resubmit хийх хүсэлтийг зөвшөөрөх эсвэл зөвшөөрөхгүй байх боломжтой
8. Багш resubmit  хийх зөвшөөрөл олгосон тохиолдолд сурагч дахин тогтоосон хугацаанд дахин тайлангаа илгээх буюу resubmit хийх боломжтой байх
9. Багш мөн resubmit-ийн дээрх процессийн дагуу үнэлэн дахин сурагчид илгээх боломжтой байх

### Ерөнхий функцүүд
1. Үйлдэл бүр нь хугцаатай хадгалагдах
2. **Текст задалбал хийх** - Файлаас текст гаргаж авах
3. **AI үнэлгээ** - Gemini API ашиглан BTEC критерийн дагуу үнэлэх
4. **Үнэлгээг хадгалах** - PostgreSQL-д үнэлгээ, дүн, санал хүсэлтүүдийг хадгалах
5. **Түүхийг харах** - Үнэлгээний түүхийг нь дүрслэх

---

## 🔑 Үндсэн зарчимууд

### 1. **SOLID зарчимууд**
- **S**: Single Responsibility - Нэг зүйлийг сайн хийх
- **O**: Open/Closed - Нэмэхэд нээлттэй, өөрчлөхөд хаалттай
- **L**: Liskov Substitution - Үлдэгдэл класс солигдох боломжтой
- **I**: Interface Segregation - Жижиг интерфейс хангалттай
- **D**: Dependency Inversion - Абстракцид анхаарал

### 2. **DRY (Don't Repeat Yourself)**
- Кодыг дахин бичихгүй
- Utility functions ашигла

### 3. **KISS (Keep It Simple, Stupid)**
- Энгийн кодоор эхлүүлэх
- Хэрэгцээгүй ерөнхийлөлтөөс зайлах

### 4. **YAGNI (You Aren't Gonna Need It)**
- Одоохон хэрэгтэй функц л бичих

### 5. **Separation of Concerns (SoC)**
```
Frontend <-> API <-> Service <-> Repository <-> Database
```

### 6. **Type Safety**
- TypeScript бүхэлд нь
- `any` ашиглахгүй

### 7. **Error Handling & Validation**
- Input-д validation хийх
- Error-г explicit handle

### 8. **Immutability**
- State mutation зайлах
- Pure functions ашигла

### 9. **Performance**
- Code splitting
- Lazy loading
- Caching
- Query optimization

### 10. **Security First**
- Input validation
- SQL injection prevention
- XSS prevention
- Environment variables

---

## 🛠️ Технологи сонголт

### Frontend Stack
| Технологи | Сонголтын үндэслэл |
|-----------|------------------|
| **Next.js 14** | App Router, SSR, optimization |
| **React 18** | Component-based, hooks |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Fast development |
| **React Query** | Server state management |
| **Zustand** | Lightweight state management |

### Backend Stack
| Технологи | Сонголтын үндэслэл |
|-----------|------------------|
| **Next.js API Routes** | Same codebase |
| **Prisma ORM** | Type-safe |
| **PostgreSQL** | Relational data |
| **Zod** | Runtime validation |
| **NextAuth.js** | Secure authentication |

### Infrastructure
| Технологи | Сонголтын үндэслэл |
|-----------|------------------|
| **Docker** | Consistency |
| **Docker Compose** | Orchestration |
| **PostgreSQL 15** | Latest features |

---

## 🏗️ Системийн архитектур

### Дотоод архитектур

```
Frontend (React)
    ↓
useAuth, useAssignments, useEvaluations (Custom Hooks)
    ↓
React Query (Server State)
    ↓
Zustand Stores (Client State)
    ↓
API Client (Axios)
    ↓
Next.js API Routes
    ↓
Service Layer (Business Logic)
    ↓
Prisma ORM
    ↓
PostgreSQL Database (Volumes)
```

---

## 📁 Файлын бүтэц

```
btec-evaluator/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── assignments/page.tsx
│   │   ├── upload/page.tsx
│   │   ├── evaluations/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/(register, login, logout)
│   │   ├── assignments/(CRUD)
│   │   ├── submissions/(list, upload)
│   │   ├── evaluations/(evaluate with Gemini)
│   │   ├── files/(upload, parse)
│   │   └── health/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/(Button, Input, Card, Modal, etc)
│   ├── forms/(Auth, Assignment, Upload)
│   ├── layouts/(Navbar, Sidebar, Dashboard)
│   └── features/(Assignment, Evaluation, File)
├── hooks/
│   ├── useAuth.ts
│   ├── useAssignments.ts
│   ├── useEvaluations.ts
│   └── useFileUpload.ts
├── lib/
│   ├── api/
│   │   ├── api-client.ts
│   │   ├── endpoints.ts
│   │   └── interceptors.ts
│   ├── gemini/
│   │   ├── gemini-client.ts
│   │   ├── prompts.ts
│   │   └── evaluation-schema.ts
│   ├── file/
│   │   ├── file-parser.ts
│   │   ├── pdf-extractor.ts
│   │   └── docx-extractor.ts
│   ├── auth/
│   │   ├── auth-config.ts
│   │   └── password-utils.ts
│   ├── validators.ts
│   ├── constants.ts
│   ├── utils.ts
│   ├── errors.ts
│   └── logger.ts
├── store/
│   ├── auth-store.ts
│   ├── ui-store.ts
│   └── evaluation-store.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── docker/
│   ├── Dockerfile.dev
│   ├── Dockerfile
│   └── init-db.sql
├── public/
│   ├── uploads/(volume)
│   └── images/
├── types/
│   ├── next-auth.d.ts
│   ├── api.ts
│   ├── models.ts
│   └── enums.ts
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── .env.example
├── .env.local (gitignored)
├── .gitignore
├── .dockerignore
├── package.json
├── CLAUDE.md (энэ файл)
└── README.md
```

---

## 📊 Өгөгдлийн загварчлал

### Models

```typescript
User {
  id, email (unique), password, fullName, role (ADMIN|TEACHER|STUDENT)
}

Assignment {
  id, title, description, rubric (JSON), createdBy (FK User)
}

Submission {
  id, assignmentId (FK), studentId (FK User), filePath, fileName, fileType
}

Evaluation {
  id, submissionId (FK), evaluatedBy (FK User)
  score (0-100), grade (A*-U), feedback, strengths[], improvements[]
  rawGeminiResponse (for audit)
}

AuditLog {
  id, userId, action, resource, resourceId, details (JSON), createdAt
}
```

### Relationships

```
User --< Assignment (createdBy)
User --< Submission (studentId)
User --< Evaluation (evaluatedBy)
Assignment --< Submission
Submission --< Evaluation (1:1)
```

---

## 🔌 API загварчлал

### Endpoints

```
/api/auth
  POST /register
  POST /login
  POST /logout
  GET /session

/api/assignments
  GET /          (list, paginated)
  POST /         (create)
  GET /:id       (detail)
  PUT /:id       (update)
  DELETE /:id    (delete)

/api/submissions
  GET /          (list)
  POST /         (create + file upload)
  GET /:id       (detail)

/api/evaluations
  GET /          (list)
  GET /:id       (detail)
  POST /evaluate (create - calls Gemini API)
  POST /batch    (bulk evaluate)

/api/files
  POST /upload   (save to volume)
  GET /:id       (download)
  POST /parse    (extract text)

/api/health
  GET /          (health check)
```

### Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  timestamp: string;
}
```

---

## 💾 State Management загварчлал

### Zustand Stores

```typescript
// auth-store.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
}

// ui-store.ts
interface UIState {
  modal: { isOpen: boolean; type: string };
  notification: { type: string; message: string };
  sidebarOpen: boolean;
}

// evaluation-store.ts
interface EvaluationState {
  cache: Map<string, Evaluation>;
  addToCache: (id: string, eval: Evaluation) => void;
}
```

### Data Flow

```
Component
  ↓
Custom Hook (useAuth, useAssignments)
  ↓
React Query (caching, sync)
  ↓
API Client (axios)
  ↓
Backend
  ↓
Database
```

---

## 🔄 Үйл явцын урсгал

### Authentication Flow

```
1. User visits → Check session (NextAuth)
2. If logged out → Redirect to /login
3. User registers → POST /api/auth/register
   - Validate email, password
   - Hash password (bcryptjs)
   - Create user in DB
4. User logs in → POST /api/auth/login
   - Validate credentials
   - Create session
   - Set secure cookie
5. Protected pages → middleware checks session
```

### Evaluation Flow

```
1. Teacher creates assignment
   → POST /api/assignments

2. Student uploads file
   → POST /api/files/upload (save to volume)
   → POST /api/submissions (link to assignment)

3. Teacher evaluates
   → POST /api/evaluations/evaluate
   → Extract text from file (PDF.js or mammoth)
   → Build prompt with rubric
   → Call Gemini API
   → Parse response (score, grade, feedback)
   → Store in DB

4. View results
   → GET /api/evaluations/:id
   → Display score, grade, feedback
```

---

## 🚀 Хөгжүүлэлтийн алхамууд

### Phase 1: Setup (Week 1)
- [x] Docker Compose files
- [x] Database schema
- [x] Project structure
- [ ] npm install & setup

### Phase 2: Auth (Week 2)
- [ ] NextAuth.js setup
- [ ] Register/Login API
- [ ] Protected routes

### Phase 3: Core Features (Week 3-4)
- [ ] Assignment CRUD
- [ ] File upload & parsing
- [ ] Submission management

### Phase 4: Gemini Integration (Week 5)
- [ ] Gemini API client
- [ ] Evaluation API
- [ ] Response parsing

### Phase 5: UI/Dashboard (Week 6)
- [ ] Dashboard layout
- [ ] Result display
- [ ] Statistics

### Phase 6: Testing (Week 7)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization

### Phase 7: Deployment (Week 8)
- [ ] Production build
- [ ] Environment config
- [ ] Monitoring

---

## 🔒 Security

### Authentication
- NextAuth.js (industry standard)
- bcryptjs password hashing
- Secure HTTP-only cookies
- CSRF protection

### Database
- Prisma ORM (SQL injection prevention)
- Parameterized queries

### API
- Zod validation
- Rate limiting (future)
- No sensitive data in logs

### Environment
- .env for secrets
- Never commit credentials

---

## 📈 Performance

### Frontend
- Code splitting (Next.js)
- Lazy loading
- React Query caching

### Backend
- Database indexes
- Query optimization
- Response caching

### Infrastructure
- Docker layer caching
- Health checks

---

## 🎯 Success Criteria

### Functionality
- ✅ All CRUD operations
- ✅ Gemini API integration
- ✅ File upload/parse
- ✅ Authentication

### Performance
- ✅ < 3s page load
- ✅ < 500ms API response
- ✅ < 10s evaluation

### Quality
- ✅ TypeScript strict mode
- ✅ No console errors
- ✅ Code reviewed
- ✅ Tests passing

---

## 📞 Support

1. Check CLAUDE.md (this file)
2. Check library docs
3. Ask Claude Code
4. Search Stack Overflow

---

**Status**: ✅ Ready for Development  
**Last Updated**: 2024  

---

## 🎬 Дараа нь хийх зүйлс

1. ✅ Docker environment setup
2. ✅ Database migrations
3. ✅ API routes development
4. ✅ React components creation
5. ✅ Gemini integration

**Claude Code extension-г ашигланыг эхлүүлэхэд сайн байна!** 🚀
