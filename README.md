# Mail Dashboard

Google Sheets `dummy mail data` 탭을 데이터 소스로 하는 읽기 전용 대시보드.

---

## STEP 0 컬럼 매핑 결과

| 컬럼 헤더 | 키 | 역할 |
|-----------|-----|------|
| 티켓ID | 티켓ID | freetext |
| 최근수신(KST) | 최근수신_KST_ | datetime |
| 경과(일) | 경과_일_ | numeric |
| 발신자 | 발신자 | email |
| 발신자유형 | 발신자유형 | category |
| 언어 | 언어 | category |
| 분류 | 분류 | category |
| 담당부서 | 담당부서 | category |
| 중요도 | 중요도 | numeric |
| 감정 | 감정 | category |
| SLA기한 | SLA기한 | datetime |
| 지연 | 지연 | boolean |
| 처리상태 | 처리상태 | status |
| 회신여부 | 회신여부 | boolean/status |
| 검토필요 | 검토필요 | boolean |
| AI회신초안/조치 | AI회신초안_조치 | longtext |
| Gmail링크 | Gmail링크 | url |
| Draft상태 | Draft상태 | status |

---

## 환경 변수 설정 (`.env.local`)

```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}  # 한 줄 JSON
GOOGLE_SHEETS_ID=1zVrJhs_0sB3wSP-vpV23usjBfS7zfPeBi8oTx_jZ9qw
GOOGLE_SHEET_TAB=dummy mail data
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
ALLOWED_HOSTED_DOMAINS=mycompany.com          # 빈 값이면 모든 Google 계정 허용
NEXTAUTH_SECRET=random-32-char-string          # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

---

## 서비스 계정 설정

1. [Google Cloud Console](https://console.cloud.google.com) → **IAM & Admin > Service Accounts**
2. 서비스 계정 생성 → **JSON 키 발급**
3. JSON 내용을 한 줄로 변환: `cat key.json | tr -d '\n'`
4. `GOOGLE_SERVICE_ACCOUNT_JSON`에 붙여넣기
5. Google Sheets에서 해당 서비스 계정 이메일을 **뷰어**로 공유

---

## Google OAuth (웹 유형) 설정

1. [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services > Credentials**
2. **OAuth 2.0 클라이언트 ID** 생성 → 애플리케이션 유형: **웹 애플리케이션**
3. 승인된 리디렉션 URI 추가:
   - `http://localhost:3000/api/auth/callback/google` (로컬)
   - `https://your-app.vercel.app/api/auth/callback/google` (배포)
4. 클라이언트 ID/Secret을 `.env.local`에 입력

---

## 로컬 실행

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Vercel 배포

```bash
npm i -g vercel
vercel --prod
```

Vercel 대시보드 → **Settings > Environment Variables**에 `.env.local` 값 모두 입력.  
`NEXTAUTH_URL`은 실제 배포 URL로 변경.
