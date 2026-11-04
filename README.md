# 수학 픽셀 스터디 (Firebase + GitHub Pages 버전)

공부 시간 인증, 수학 토벌(문제 풀이), 랭킹, 캐릭터 꾸미기 게임입니다.
화면은 GitHub Pages가, 로그인과 기록은 Firebase(무료 Spark 요금제)가 맡습니다.

## 파일

| 파일 | 하는 일 |
| --- | --- |
| index.html | 화면 틀과 디자인 |
| app.js | 학생 화면 + 선생님(관리자) 화면 |
| config.js | **Firebase 설정값을 넣는 곳 (꼭 고쳐야 함)** |
| catalog.js | 상점 아이템 목록 (여기에 줄을 추가하면 새 아이템) |
| qr.js | 접속 QR 코드 만들기 |
| firestore.rules | 보안 규칙 (Firebase 콘솔 → Firestore → 규칙에 붙여넣기) |
| manifest.webmanifest, icon-*.png | 휴대폰 홈 화면에 추가할 때 쓰는 이름과 아이콘 |

## 처음 설정

1. Firebase 프로젝트를 만들고 웹 앱 설정값(firebaseConfig)을 config.js에 붙여넣습니다.
2. Firebase에서 이메일/비밀번호 로그인과 Firestore 데이터베이스(서울)를 켜고, firestore.rules를 게시합니다.
3. 이 파일들을 GitHub 저장소에 올리고 Settings → Pages에서 main 브랜치를 공개합니다.
4. 사이트에서 학번 칸에 `admin`을 넣어 회원가입하면 선생님(관리자) 계정이 만들어집니다.

자세한 순서는 함께 받은 안내서를 보세요.

## 주의

- 문제은행 TSV 파일에는 정답이 들어 있으니 이 저장소에 올리지 마세요. 관리자 화면의 [문제 넣기]에 붙여넣기만 하면 됩니다.
- config.js의 apiKey는 공개되어도 괜찮은 값입니다. 데이터는 firestore.rules가 지킵니다.
- 보안 규칙(firestore.rules)과 app.js의 계정 주소(`mathpixel.example.com`)는 서로 같아야 하니 함께 고치지 않는 한 바꾸지 마세요.
